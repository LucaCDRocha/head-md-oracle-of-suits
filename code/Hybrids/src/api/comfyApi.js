/**
 * comfyApi.js - Local generation client using ComfyUI with IPAdapter image uploads
 */

import { COMFYUI_API_BASE, COMFYUI_PROMPT_NODE_ID, DEBUG } from "../../config.js";

// Default standard text-to-image workflow fallback (SD1.5 structure)
const DEFAULT_WORKFLOW = {
  "3": {
    "inputs": {
      "seed": 123456,
      "steps": 25,
      "cfg": 7,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": { "title": "KSampler" }
  },
  "4": {
    "inputs": {
      "checkpoint_name": "v1-5-pruned-emaonly.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": { "title": "Load Checkpoint" }
  },
  "5": {
    "inputs": {
      "width": 768,
      "height": 1024,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage",
    "_meta": { "title": "Empty Latent Image" }
  },
  "6": {
    "inputs": {
      "text": "hybrid card design",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "CLIP Text Encode (Positive Prompt)" }
  },
  "7": {
    "inputs": {
      "text": "bad quality, blurry, low resolution, worst quality, text, watermark, signature",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "CLIP Text Encode (Negative Prompt)" }
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "VAE Decode" }
  },
  "9": {
    "inputs": {
      "filename_prefix": "Hybrids",
      "images": ["8", 0]
    },
    "class_type": "SaveImage",
    "_meta": { "title": "Save Image" }
  }
};

/**
 * Fetch remote card image as a Blob, routing through proxy if necessary
 */
async function fetchImageAsBlob(imgUrl) {
	let fetchUrl = imgUrl;
	if (imgUrl.startsWith('http') && !imgUrl.includes(window.location.host)) {
		fetchUrl = `/proxy-image?url=${encodeURIComponent(imgUrl)}`;
	}
	const res = await fetch(fetchUrl);
	if (!res.ok) {
		throw new Error(`Failed to fetch card image: ${imgUrl}`);
	}
	return res.blob();
}

/**
 * Fetch remote card image as a Raw Base64 string, routing through proxy if necessary
 */
async function fetchImageAsRawBase64(imgUrl) {
	let fetchUrl = imgUrl;
	if (imgUrl.startsWith('http') && !imgUrl.includes(window.location.host)) {
		fetchUrl = `/proxy-image?url=${encodeURIComponent(imgUrl)}`;
	}
	const res = await fetch(fetchUrl);
	if (!res.ok) {
		throw new Error(`Failed to fetch card image: ${imgUrl}`);
	}
	const blob = await res.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const rawBase64 = reader.result.split(',')[1];
			resolve(rawBase64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * Upload an image Blob to ComfyUI input directory
 */
async function uploadToComfyUI(blob, filename) {
	const formData = new FormData();
	formData.append("image", blob, filename);
	formData.append("overwrite", "true");

	const uploadUrl = `${COMFYUI_API_BASE}/upload/image`;
	const res = await fetch(uploadUrl, {
		method: "POST",
		body: formData
	});

	if (!res.ok) {
		throw new Error("Failed to upload image to ComfyUI: " + res.statusText);
	}

	const data = await res.json();
	return data.name; // Return filename saved in ComfyUI's input folder
}

/**
 * Generate an image using ComfyUI local API
 * @param {Array} selected - Array of selected cards
 * @param {number} baseCardId - ID of the base card
 * @param {Function} statusCallback - Callback to update status messages
 * @returns {Promise<string>} Base64 encoded image data
 */
export async function generateImage(selected, baseCardId, statusCallback) {
	if (!selected || selected.length === 0) {
		throw new Error("No cards selected for generation");
	}

	statusCallback("Chargement du workflow ComfyUI...");
	
	// 1. Load workflow_api.json or fallback
	let workflow = DEFAULT_WORKFLOW;
	try {
		const workflowRes = await fetch("/workflow_api.json");
		if (workflowRes.ok) {
			workflow = await workflowRes.json();
			statusCallback("workflow_api.json chargé avec succès.");
		} else {
			statusCallback("workflow_api.json introuvable, utilisation du workflow par défaut.");
		}
	} catch (err) {
		console.warn("Failed to load custom workflow_api.json:", err);
		statusCallback("Utilisation du workflow par défaut.");
	}

	// 2. Load and set reference images in the workflow
	const base64NodeIds = Object.keys(workflow).filter(
		(id) => workflow[id].class_type === "easy loadImageBase64" || 
		        workflow[id].class_type === "LoadImageBase64" || 
		        (workflow[id].class_type && workflow[id].class_type.toLowerCase().includes("base64"))
	);
	
	const standardNodeIds = Object.keys(workflow).filter(
		(id) => workflow[id].class_type === "LoadImage"
	);

	// Sort numerically to assign consistently
	base64NodeIds.sort((a, b) => parseInt(a) - parseInt(b));
	standardNodeIds.sort((a, b) => parseInt(a) - parseInt(b));

	if (base64NodeIds.length > 0) {
		statusCallback("Traitement des images base64 pour ComfyUI...");
		for (let i = 0; i < base64NodeIds.length; i++) {
			const nodeId = base64NodeIds[i];
			const cardIndex = i % selected.length;
			const card = selected[cardIndex];
			
			statusCallback(`Preparation de l'image base64 ${i+1}/${base64NodeIds.length}...`);
			const rawBase64 = await fetchImageAsRawBase64(card.img_src);
			
			// Inject base64 string directly into workflow JSON inputs
			workflow[nodeId].inputs.base64_data = rawBase64;
		}
	} else if (standardNodeIds.length > 0) {
		statusCallback("Envoi des images de référence à ComfyUI...");
		for (let i = 0; i < standardNodeIds.length; i++) {
			const nodeId = standardNodeIds[i];
			const cardIndex = i % selected.length;
			const card = selected[cardIndex];
			
			statusCallback(`Preparation de l'image ${i+1}/${standardNodeIds.length}...`);
			const blob = await fetchImageAsBlob(card.img_src);
			
			// Formulate filename
			const ext = card.img_src.split('.').pop().split('?')[0] || 'jpg';
			const uploadFilename = `card_reference_${i}_${Date.now()}.${ext}`;
			
			statusCallback(`Upload de l'image ${i+1}/${standardNodeIds.length}...`);
			const comfyFilename = await uploadToComfyUI(blob, uploadFilename);
			
			// Assign to workflow LoadImage node
			workflow[nodeId].inputs.image = comfyFilename;
		}
	}

	// 3. Find the positive prompt node dynamically
	let positiveNodeId = null;
	
	// Trace positive connection from KSampler node
	const samplerNodeId = Object.keys(workflow).find(
		(id) => workflow[id].class_type === "KSampler"
	);

	if (samplerNodeId && workflow[samplerNodeId].inputs) {
		const sampler = workflow[samplerNodeId].inputs;
		if (Array.isArray(sampler.positive)) {
			positiveNodeId = String(sampler.positive[0]);
		}
	}

	// Fallback to config value or search CLIPTextEncode
	if (!positiveNodeId || !workflow[positiveNodeId]) {
		const promptNodeIdStr = String(COMFYUI_PROMPT_NODE_ID);
		if (workflow[promptNodeIdStr] && workflow[promptNodeIdStr].class_type === "CLIPTextEncode") {
			positiveNodeId = promptNodeIdStr;
		} else {
			// Find first CLIPTextEncode node that isn't the negative prompt
			positiveNodeId = Object.keys(workflow).find((id) => {
				if (workflow[id].class_type !== "CLIPTextEncode") return false;
				const txt = (workflow[id].inputs.text || "").toLowerCase();
				return !txt.includes("bad quality") && !txt.includes("blurry") && !txt.includes("lowres");
			});
		}
	}

	// 4. Inject prompt to harmonize the mix
	if (positiveNodeId && workflow[positiveNodeId]) {
		const baseId = baseCardId || selected[0]?.id;
		const baseCard = selected.find((s) => s.id === baseId) || selected[0];
		
		const otherCards = selected.filter(c => c.id !== baseCard.id);
		
		let mixDetails = `A playing card that is a hybrid fusion based on the base card "${baseCard.name}" (from the deck "${baseCard.game?.name || 'Unknown'} ")`;
		if (otherCards.length > 0) {
			const otherDescriptions = otherCards.map(c => `"${c.name}" (from the deck "${c.game?.name || 'Unknown'}")`).join(" and ");
			mixDetails += `, fused with elements from ${otherDescriptions}`;
		}

		const originalPrompt = workflow[positiveNodeId].inputs.text || "";
		
		// Blend card details with the original style keywords in the workflow
		const harmonizedPrompt = `${mixDetails}. ${originalPrompt}`;
		workflow[positiveNodeId].inputs.text = harmonizedPrompt;
		
		if (DEBUG) {
			console.log("COMFYUI HARMONIZED PROMPT:", harmonizedPrompt);
		}
	} else {
		console.warn("Could not locate a positive prompt node in the workflow. Image generation might use template values.");
	}

	// 5. Randomize seed in all KSampler nodes
	for (const id in workflow) {
		if (workflow[id].class_type === "KSampler" && workflow[id].inputs && workflow[id].inputs.seed !== undefined) {
			workflow[id].inputs.seed = Math.floor(Math.random() * 1000000000000);
		}
	}

	if (DEBUG) {
		statusCallback("DEBUG: Affichage des logs ComfyUI");
		return "PROMPT:COMFYUI => " + JSON.stringify(workflow, null, 2);
	}

	// 6. Post prompt request to ComfyUI
	statusCallback("Envoi du workflow à ComfyUI...");
	const promptPayload = {
		prompt: workflow,
		client_id: "hybrids_installation_" + Math.random().toString(36).substring(2, 10)
	};

	const promptRes = await fetch(`${COMFYUI_API_BASE}/prompt`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(promptPayload)
	});

	if (!promptRes.ok) {
		let errorDetails = "";
		try {
			const errJson = await promptRes.json();
			if (errJson && errJson.error) {
				errorDetails = `: ${errJson.error.message || ""} ${JSON.stringify(errJson.error.details || "")}`;
			} else {
				errorDetails = `: ${JSON.stringify(errJson)}`;
			}
		} catch (e) {
			errorDetails = `: ${promptRes.statusText}`;
		}
		throw new Error("Failed to post prompt to ComfyUI" + errorDetails);
	}

	const promptData = await promptRes.json();
	const promptId = promptData.prompt_id;

	// 7. Poll /history for output images
	const historyUrl = `${COMFYUI_API_BASE}/history/${promptId}`;
	let filename = null;
	let subfolder = "";
	let folderType = "output";

	const maxPollSeconds = 180; // 3 minutes timeout for heavy XL / Turbo models
	for (let i = 0; i < maxPollSeconds; i++) {
		await new Promise(resolve => setTimeout(resolve, 1000));
		statusCallback(`Calcul ComfyUI en cours (${i}s)...`);

		const historyRes = await fetch(historyUrl);
		if (historyRes.ok) {
			const historyData = await historyRes.json();
			const promptInfo = historyData[promptId];
			if (promptInfo) {
				// Check for prompt execution errors (e.g. failed loader, missing weights)
				if (promptInfo.status && promptInfo.status.status_str === "error") {
					const messages = promptInfo.status.messages || [];
					const errorMsg = messages.map(m => (m[1] && m[1].message) ? m[1].message : JSON.stringify(m)).join("\n");
					throw new Error(`ComfyUI Execution Error: ${errorMsg}`);
				}
				
				const outputs = promptInfo.outputs;
				for (const nodeId in outputs) {
					if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
						const imgInfo = outputs[nodeId].images[0];
						filename = imgInfo.filename;
						subfolder = imgInfo.subfolder || "";
						folderType = imgInfo.type || "output";
						break;
					}
				}
				break;
			}
		}
	}

	if (!filename) {
		throw new Error("ComfyUI generation timed out or returned no images.");
	}

	// 8. Download generated image
	statusCallback("Téléchargement de la carte générée...");
	let viewUrl = `${COMFYUI_API_BASE}/view?filename=${encodeURIComponent(filename)}&type=${folderType}`;
	if (subfolder) {
		viewUrl += `&subfolder=${encodeURIComponent(subfolder)}`;
	}

	const imgRes = await fetch(viewUrl);
	if (!imgRes.ok) {
		throw new Error("Failed to fetch generated image from ComfyUI: " + imgRes.statusText);
	}

	const blob = await imgRes.blob();
	
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64 = reader.result.split(',')[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
