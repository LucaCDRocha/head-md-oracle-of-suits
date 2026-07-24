/**
 * comfyApi.js - Local generation client using ComfyUI with IPAdapter image uploads
 */

import { COMFYUI_API_BASE, COMFYUI_PROMPT_NODE_ID, DEBUG } from "../../config.js";

// Set to true to print the full concatenated prompt preview in the browser console
const LOG_PROMPT_PREVIEW = false;

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
 * Formats a card description using its value, suits, and game name.
 */
function formatCardDescription(card) {
	if (!card) return "";
	const val = card.value || "";
	const suit = card.suits || "";
	const game = card.game?.name || "";
	const isJoker = String(val).toLowerCase() === "joker";
	
	if (isJoker) {
		return `Joker card from deck "${game}"`;
	}
	if (val && suit) {
		return `"${val} of ${suit}" card from deck "${game}"`;
	}
	if (val) {
		return `"${val}" card from deck "${game}"`;
	}
	return `card from deck "${game}"`;
}

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

	// Find base card and other cards
	const baseId = baseCardId || selected[0]?.id;
	const baseCard = selected.find((s) => s.id === baseId) || selected[0];
	const otherCards = selected.filter(c => c.id !== baseCard.id);

	if (base64NodeIds.length > 0) {
		statusCallback("Traitement des images base64 pour ComfyUI...");
		
		// Find base image node
		const baseNodeId = base64NodeIds.find(
			(id) => workflow[id]._meta?.title && workflow[id]._meta.title.toLowerCase().includes("base")
		) || "120"; // Fallback to "120"
		
		const resolvedBaseNodeId = workflow[baseNodeId] ? baseNodeId : base64NodeIds[0];
		
		// Other base64 nodes sorted numerically
		const otherNodeIds = base64NodeIds.filter(id => id !== resolvedBaseNodeId);
		otherNodeIds.sort((a, b) => parseInt(a) - parseInt(b));

		// Set base image base64
		statusCallback("Preparation de l'image de base (base64)...");
		const baseRawBase64 = await fetchImageAsRawBase64(baseCard.img_src);
		workflow[resolvedBaseNodeId].inputs.base64_data = baseRawBase64;

		// Set other images base64
		for (let i = 0; i < otherNodeIds.length; i++) {
			const nodeId = otherNodeIds[i];
			const cardsList = otherCards.length > 0 ? otherCards : selected;
			const card = cardsList[i % cardsList.length];
			
			statusCallback(`Preparation de l'image secondaire ${i+1}/${otherNodeIds.length}...`);
			const rawBase64 = await fetchImageAsRawBase64(card.img_src);
			workflow[nodeId].inputs.base64_data = rawBase64;
		}
	} else if (standardNodeIds.length > 0) {
		statusCallback("Envoi des images de référence à ComfyUI...");
		
		// Find base image node for standard LoadImage
		const baseNodeId = standardNodeIds.find(
			(id) => workflow[id]._meta?.title && workflow[id]._meta.title.toLowerCase().includes("base")
		) || standardNodeIds[0];

		const otherNodeIds = standardNodeIds.filter(id => id !== baseNodeId);
		otherNodeIds.sort((a, b) => parseInt(a) - parseInt(b));

		// Upload base image
		statusCallback("Upload de l'image de base...");
		const baseBlob = await fetchImageAsBlob(baseCard.img_src);
		const baseExt = baseCard.img_src.split('.').pop().split('?')[0] || 'jpg';
		const baseUploadFilename = `card_reference_base_${Date.now()}.${baseExt}`;
		const baseComfyFilename = await uploadToComfyUI(baseBlob, baseUploadFilename);
		workflow[baseNodeId].inputs.image = baseComfyFilename;

		// Upload other images
		for (let i = 0; i < otherNodeIds.length; i++) {
			const nodeId = otherNodeIds[i];
			const cardsList = otherCards.length > 0 ? otherCards : selected;
			const card = cardsList[i % cardsList.length];
			
			statusCallback(`Preparation de l'image secondaire ${i+1}/${otherNodeIds.length}...`);
			const blob = await fetchImageAsBlob(card.img_src);
			const ext = card.img_src.split('.').pop().split('?')[0] || 'jpg';
			const uploadFilename = `card_reference_${i}_${Date.now()}.${ext}`;
			
			statusCallback(`Upload de l'image secondaire ${i+1}/${otherNodeIds.length}...`);
			const comfyFilename = await uploadToComfyUI(blob, uploadFilename);
			workflow[nodeId].inputs.image = comfyFilename;
		}
	}

	// 3. Inject actual suit and rank of the base card into the base prompt (node 112 / Prompt string)
	const promptNode = Object.values(workflow).find(
		(node) => node.class_type === "PrimitiveStringMultiline" && 
		          node.inputs && 
		          typeof node.inputs.value === "string" && 
		          node.inputs.value.includes("CARD LAYOUT")
	);
	if (promptNode) {
		const suit = baseCard.suits || "";
		const value = baseCard.value || "";
		const gameName = (baseCard.game?.name || "").toLowerCase();
		const suitLower = suit.toLowerCase();
		
		// Determine if the base card is a standard playing card (Bicycle, Copag, Jass, Piquet, Ducale, etc.)
		const isTarot = gameName.includes("tarot") || gameName.includes("marseille") || gameName.includes("waite");
		const isJass = gameName.includes("jass");
		const isPlayingCard = !isTarot;

		const isJoker = String(value).toLowerCase() === "joker";
		
		const suitSymbolMap = {
			"spades": "♠",
			"hearts": "♥",
			"diamonds": "♦",
			"clubs": "♣",
			"♠": "♠",
			"♥": "♥",
			"♦": "♦",
			"♣": "♣"
		};
		const suitSymbol = suitSymbolMap[suitLower] || suit;

		let cornerMarkingsDesc = "";
		if (isJoker) {
			cornerMarkingsDesc = `Top-left and bottom-right corners must display strictly the word "JOKER" (rotated 180 degrees on the bottom-right corner). Keep all corners clean of other suit symbols or ranks. Absolutely IGNORE any suit symbols, rank markings, or corner numbers mentioned in Card 2 and Card 3.`;
		} else if (isPlayingCard) {
			const rankStr = value ? `"${value}"` : "the rank";
			const suitStr = suitSymbol ? `"${suitSymbol}"` : "the suit symbol";
			
			// Determine color based on suit symbol
			let colorDesc = "";
			if (suitLower.includes("heart") || suitLower.includes("diamond") || suitLower.includes("♥") || suitLower.includes("♦")) {
				colorDesc = " Use red color for both the rank and the suit symbol.";
			} else if (suitLower.includes("spade") || suitLower.includes("club") || suitLower.includes("♠") || suitLower.includes("♣")) {
				colorDesc = " Use black color for both the rank and the suit symbol.";
			}
			
			cornerMarkingsDesc = `Top-left and bottom-right corners must display strictly the matching rank ${rankStr} and suit symbol ${suitStr} belonging strictly to the base card. Rotate the bottom-right corner indices 180 degrees upside-down.${colorDesc} Do NOT include any other suit symbols (such as hearts, diamonds, spades, clubs, cups, swords, wands, etc.) in the corners or near the indices. Only draw the single specified suit symbol ${suitStr} and nothing else. Absolutely IGNORE any suit symbols, rank markings, or corner numbers mentioned in Card 2 and Card 3.`;
		} else {
			// For Tarot cards, they prefer not to have corner numbers, but if they are there they should be correct
			cornerMarkingsDesc = `Preferably keep all corners clean, plain, and unprinted. However, if the generation layout includes corner markings or corner circles, they must display strictly the rank/number "${value}" of the base card (e.g., "${value}" or its Roman numeral equivalent) and absolutely nothing else. Do NOT write any other numbers (such as "4", "3", etc.) or suit symbols in the corners.`;
		}
		
		let promptValue = promptNode.inputs.value;
		
		// Find the line starting with "- Corner Markings:" and replace it
		const cornerMarkingsRegex = /- Corner Markings:.*?(?=\n\n|\n[A-Z]|$)/s;
		if (cornerMarkingsRegex.test(promptValue)) {
			promptValue = promptValue.replace(
				cornerMarkingsRegex,
				`- Corner Markings: ${cornerMarkingsDesc}`
			);
		} else {
			// Fallback: replace substring
			promptValue = promptValue.replace(
				"matching rank initial and suit symbol belonging strictly to Primary Card 1",
				`matching rank initial ${value ? `"${value}"` : ""} and suit symbol ${suitSymbol ? `"${suitSymbol}"` : ""} belonging strictly to the base card`
			);
		}

		// Generate whitelist of allowed text/numbers based on the base card name, value, and suit
		const nameClean = (baseCard.name || "").replace(/of\s+\w+/gi, ""); // Remove "of Clubs", "of Major Arcana"
		const cardNameWords = nameClean.split(/[\s-_,.]+/).filter(w => w.length > 1 && w.toLowerCase() !== "the");
		const allowedWords = [...new Set([value, suitSymbol, ...cardNameWords])].filter(Boolean);
		const allowedWordsStr = allowedWords.map(w => `"${w}"`).join(", ");

		const isCourtCard = value && (
			value === "K" || value === "Q" || value === "J" || 
			value === "King" || value === "Queen" || value === "Jack" || 
			value === "Roi" || value === "Dame" || value === "Valet" || 
			value === "Page" || value === "Cavalier" ||
			String(value).toLowerCase().includes("king") ||
			String(value).toLowerCase().includes("queen") ||
			String(value).toLowerCase().includes("jack")
		);

		// Add strict layout and clean composition rules (no card titles/texts at the bottom, no deformed bodies/limbs)
		let cleanCompositionRule = `\n- Absolutely No Hallucinated Text or Numbers: You must absolutely NOT write, draw, or print any numbers (such as "4", "3", "7", etc.) or words (such as "June Stwert", "Temperance", "The Star", "The Moon", etc.) that do not belong to the base card. The ONLY allowed text, words, or numbers anywhere on the generated card are: ${allowedWordsStr} (if any text/numbers are generated at all). Any other names, titles, Roman numerals, or words mentioned in the descriptions of Card 2 and Card 3 must be completely ignored and must NOT be written anywhere on the card.
- Absolutely No Nudity: The generated card must be completely free of any nudity, nakedness, or partial nudity. All human figures or characters depicted on the card must be fully clothed in elegant robes, garments, classical armor, or attire matching the style of the cards. Ensure there is no naked skin of the torso, chest, or lower body. Absolutely no bare breasts, no exposed chests, no bare torsos, and no naked midriffs. All chest and torso skin must be completely covered with thick fabric, shirts, armor, or robes. Absolutely no sheer, translucent, or see-through clothing; all outfits must be completely opaque, high-necked, and fully closed up to the collarbone.
- Character Generation Rule: Only draw human figures, characters, or persons if they are explicitly mentioned in the descriptions of Card 1, Card 2, or Card 3. If none of the card descriptions mention a person, figure, character, man, woman, or human, then absolutely DO NOT generate any people, human figures, or characters; instead, focus solely on the objects, symbols, landscapes, and patterns described.
- Symmetrical & Clean Layout: Ensure the bottom area of the card is clean and logically matches the scene (e.g. rocks, cliff, grass, or simple decorative background). Do NOT generate any extra, partial, upside-down, or deformed human bodies, limbs, or faces at the bottom of the card.`;

		if (isJass || isCourtCard) {
			cleanCompositionRule += `\n- Mirrored Symmetrical Design: The card must be a mirrored double-headed playing card layout. Draw a clear horizontal division line across the middle of the card. Symmetrically mirror the central illustration and suit symbols between the top half and the bottom half (the bottom half must be an upside-down mirrored copy of the top half). Symmetrically arrange the suit symbols (e.g. acorns, bells, roses, shields, clubs, spades, hearts, diamonds) on the top and bottom halves matching the count and layout of the base card.`;
		}

		// Find the final concatenation node (usually node 115) containing the prompt suffix, and append constraints there
		const suffixNode = Object.values(workflow).find(
			(node) => node.class_type === "StringConcatenate" && 
			          typeof node.inputs?.string_b === "string" && 
			          node.inputs.string_b.includes("ARTISTIC STYLE")
		);

		if (suffixNode) {
			suffixNode.inputs.string_b = suffixNode.inputs.string_b + "\n\nCRITICAL CONSTRAINTS (MUST OVERRIDE ALL PREVIOUS DESCRIPTIONS AND CAPTIONS):" + cleanCompositionRule;
		}

		// Inject the explicit card identity names and source decks into the delimiters of the workflow's StringConcatenate nodes
		if (workflow["98"]) {
			workflow["98"].inputs.delimiter = `\n\nPrimary Card 1 (Base Card: ${formatCardDescription(baseCard)}) is described as: `;
		}
		if (workflow["101"] && otherCards[0]) {
			workflow["101"].inputs.delimiter = `, combined with elements of Card 2 (${formatCardDescription(otherCards[0])}) described as: `;
		}
		if (workflow["102"] && otherCards[1]) {
			workflow["102"].inputs.delimiter = `, and Card 3 (${formatCardDescription(otherCards[1])}) described as: `;
		}
		
		promptNode.inputs.value = promptValue;
		
		// Rebuild and log the final concatenated prompt on the client-side for debugging / monitoring if enabled
		if (LOG_PROMPT_PREVIEW) {
			try {
				const node112Text = promptNode.inputs.value;
				const card1Desc = `[Florence2 description of Card 1: ${formatCardDescription(baseCard)}]`;
				const card2Desc = otherCards[0] ? `[Florence2 description of Card 2: ${formatCardDescription(otherCards[0])}]` : "";
				const card3Desc = otherCards[1] ? `[Florence2 description of Card 3: ${formatCardDescription(otherCards[1])}]` : "";
				
				const delimiter1 = workflow["98"] ? workflow["98"].inputs.delimiter : "Card 1: ";
				const delimiter2 = (workflow["101"] && otherCards[0]) ? workflow["101"].inputs.delimiter : ", combined with elements of Card 2: ";
				const delimiter3 = (workflow["102"] && otherCards[1]) ? workflow["102"].inputs.delimiter : ", and Card 3: ";
				const suffixText = suffixNode ? suffixNode.inputs.string_b : "";
				
				const fullPromptPreview = node112Text + delimiter1 + card1Desc + delimiter2 + card2Desc + delimiter3 + card3Desc + suffixText;
				
				console.log("=== COMFYUI GENERATOR: FULL COMBINED PROMPT PREVIEW ===");
				console.log(fullPromptPreview);
			} catch (err) {
				console.warn("Could not generate client-side full prompt preview:", err);
			}
		}
	}

	// 5. Randomize seeds / noise_seeds in all nodes if present
	for (const id in workflow) {
		if (workflow[id].inputs) {
			if (workflow[id].inputs.seed !== undefined) {
				workflow[id].inputs.seed = Math.floor(Math.random() * 1000000000000000);
			}
			if (workflow[id].inputs.noise_seed !== undefined) {
				workflow[id].inputs.noise_seed = Math.floor(Math.random() * 1000000000000000);
			}
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
