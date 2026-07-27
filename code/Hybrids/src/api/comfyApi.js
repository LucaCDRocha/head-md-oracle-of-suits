/**
 * comfyApi.js - Local generation client using ComfyUI with IPAdapter image uploads
 */

import { COMFYUI_API_BASE, COMFYUI_PROMPT_NODE_ID, DEBUG } from "../../config.js";

// Set to true to print the full concatenated prompt preview in the browser console
const LOG_PROMPT_PREVIEW = true;

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

// ── French → English translation maps (built from the database Excel) ──

const SUITS_FR_TO_EN = {
	// French standard suits
	"pique":     "Spades",
	"cœur":      "Hearts",
	"coeur":     "Hearts",
	"carreau":   "Diamonds",
	"trèfle":    "Clubs",
	"trefle":    "Clubs",
	// Tarot suits
	"atout":     "Trumps",
	"épée":      "Swords",
	"epée":      "Swords",
	"epee":      "Swords",
	"coupe":     "Cups",
	"denier":    "Coins",
	"bâton":     "Wands",
	"baton":     "Wands",
	// Swiss / Jass suits
	"bouclier":  "Shields",
	"gland":     "Acorns",
	"grelot":    "Bells",
	"rose":      "Roses",
	"feuille":   "Leaves",
	// Special
	"joker":     "Joker",
	"excuse":    "The Fool",
	"fou":       "The Fool",
	"mat":       "The Fool",
};

const VALUES_FR_TO_EN = {
	// Court cards
	"roi":       "King",
	"dame":      "Queen",
	"valet":     "Jack",
	"cavalier":  "Knight",
	"as":        "Ace",
	// German-suited court cards
	"ober":      "Ober",
	"unter":     "Unter",
	"daus":      "Deuce",
	"könig":     "King",
	"konig":     "King",
	// Special cards
	"excuse":    "The Fool",
	"fou":       "The Fool",
	"mat":       "The Fool",
	"joker":     "Joker",
	// French Revolution deck values
	"génie":     "Genius",
	"genie":     "Genius",
	"liberté":   "Liberty",
	"liberte":   "Liberty",
	"égalité":   "Equality",
	"egalite":   "Equality",
};

const GAMES_FR_TO_EN = {
	// Tarot decks
	"tarot rider-waite":     "Rider-Waite Tarot",
	"tarot grimaud":         "Grimaud Tarot",
	"tarot burdel":          "Burdel Tarot",
	"tarot dondorf":         "Dondorf Tarot",
	"tarot gassmann":        "Gassmann Tarot",
	"tarot payen":           "Payen Tarot",
	"tarot animalier":       "Animal Tarot",
	"tarot autrichien":      "Austrian Tarot",
	"tarot aux paysages":    "Landscape Tarot",
	"tarot enluminé":        "Illuminated Tarot",
	"tarot enlumine":        "Illuminated Tarot",
	"tarot à 2 têtes":       "Two-Headed Tarot",
	"tarot a 2 tetes":       "Two-Headed Tarot",
	"grand tarrau":          "Grand Tarrau Tarot",
	"tarocco piemontese":    "Piedmontese Tarocco",
	"slovenski tarok":       "Slovenian Tarok",
	"slovanski tarok":       "Slovenian Tarok",
	// Jass decks
	"jass classique":        "Classic Jass",
	"jass coloré":           "Colored Jass",
	"jass colore":           "Colored Jass",
	"jass de luxe":          "Deluxe Jass",
	// Regional French card sets
	"cartes gassmann":       "Gassmann Cards",
	"cartes gatteaux":       "Gatteaux Cards",
	"cartes marisi":         "Marisi Cards",
	"cartes müller":         "Müller Cards",
	"cartes muller":         "Müller Cards",
	"cartes western":        "Western Cards",
	"cartes catalanes":      "Catalan Cards",
	"cartes lyonnaises":     "Lyonnais Cards",
	"cartes mexicaines":     "Mexican Cards",
	"cartes saxonnes":       "Saxon Cards",
	"cartes sévillanes":     "Sevillan Cards",
	"cartes sevillanes":     "Sevillan Cards",
	// Special / themed decks
	"doubles enseignes":     "Double-Suited Cards",
	"jeu duratone":          "Duratone Deck",
	"jeu piatnik":           "Piatnik Deck",
	"jeu assemblé":          "Assembled Deck",
	"jeu assemble":          "Assembled Deck",
	"jeu aux cantons":       "Canton Deck",
	"jeu de munich":         "Munich Deck",
	"jeu de nuremberg":      "Nuremberg Deck",
	"jeu de plaisance":      "Plaisance Deck",
	"jeu de schaffhouse":    "Schaffhausen Deck",
	"jeu de la chance":      "Luck Deck",
	"jeu de patience":       "Patience Deck",
	"jeu de vaches":         "Cow Deck",
	"jeu en russe":          "Russian Deck",
	"jeu musical":           "Musical Deck",
	"jeu républicain":       "Republican Deck",
	"jeu republicain":       "Republican Deck",
};

/**
 * Translates a French term to English using the provided map.
 * Falls back to the original term if no translation is found.
 */
function translateTerm(term, map) {
	if (!term) return "";
	const key = String(term).toLowerCase().trim();
	return map[key] || term;
}

// ── French Tarot Major Arcana Titles ──
const TAROT_FRENCH_TITLES = {
	"0": "LE MAT",
	"excuse": "LE MAT",
	"fou": "LE MAT",
	"mat": "LE MAT",
	"1": "I - LE BATELEUR",
	"2": "II - LA PAPESSE",
	"3": "III - L'IMPÉRATRICE",
	"4": "IV - L'EMPEREUR",
	"5": "V - LE PAPE",
	"6": "VI - L'AMOUREUX",
	"7": "VII - LE CHARIOT",
	"8": "VIII - LA JUSTICE",
	"9": "IX - L'ERMITE",
	"10": "X - LA ROUE DE FORTUNE",
	"11": "XI - LA FORCE",
	"12": "XII - LE PENDU",
	"13": "XIII - LA MORT",
	"14": "XIV - LA TEMPÉRANCE",
	"15": "XV - LE DIABLE",
	"16": "XVI - LA MAISON DIEU",
	"17": "XVII - L'ÉTOILE",
	"18": "XVIII - LA LUNE",
	"19": "XIX - LE SOLEIL",
	"20": "XX - LE JUGEMENT",
	"21": "XXI - LE MONDE"
};

/**
 * Computes exact allowable text and placement strings for a card.
 */
function getExactCardTextConfig(baseCard) {
	const rawVal = String(baseCard.value || "").trim();
	const rawSuit = String(baseCard.suits || "").trim();
	const rawGame = String(baseCard.game?.name || "").toLowerCase();

	const suitLowerRaw = rawSuit.toLowerCase();
	const isTarotAtout = suitLowerRaw === "atout" || suitLowerRaw === "major arcana" || suitLowerRaw === "trumps" || suitLowerRaw === "atouts";
	const isTarotGame = rawGame.includes("tarot") || rawGame.includes("marseille") || rawGame.includes("waite") || rawGame.includes("tarocco") || rawGame.includes("tarok");
	const isTarot = isTarotAtout || isTarotGame;
	const isJass = rawGame.includes("jass") || rawGame.includes("saxon") || rawGame.includes("munich");
	const isJoker = rawVal.toLowerCase() === "joker";

	// Rank initial for court cards - ALWAYS use English initials (K, Q, J, A)
	let rankInitial = rawVal;
	const valLower = rawVal.toLowerCase();

	if (valLower === "king" || valLower === "könig" || valLower === "konig" || valLower === "roi" || valLower === "r") rankInitial = "K";
	else if (valLower === "queen" || valLower === "dame" || valLower === "d") rankInitial = "Q";
	else if (valLower === "jack" || valLower === "valet" || valLower === "v") rankInitial = "J";
	else if (valLower === "cavalier" || valLower === "knight") rankInitial = "C";
	else if (valLower === "page") rankInitial = "P";
	else if (valLower === "ace" || valLower === "as" || valLower === "daus") rankInitial = "A";
	else if (valLower === "ober") rankInitial = "O";
	else if (valLower === "unter") rankInitial = "U";

	// Suit symbol mapping
	const suitSymbolMap = {
		"spades": "♠", "pique": "♠", "♠": "♠",
		"hearts": "♥", "cœur": "♥", "coeur": "♥", "♥": "♥",
		"diamonds": "♦", "carreau": "♦", "♦": "♦",
		"clubs": "♣", "trèfle": "♣", "trefle": "♣", "♣": "♣"
	};
	const suitSymbol = suitSymbolMap[suitLowerRaw] || "";

	let topCornerText = "";
	let bottomTitleText = "";
	let isTarotMajor = false;

	if (isJoker) {
		topCornerText = "JOKER";
	} else if (isTarotAtout || (isTarotGame && (suitLowerRaw === "" || suitLowerRaw === "atout"))) {
		// Major Arcana (Atout)
		const cleanKey = valLower.replace(/^atout\s*/, "");
		if (TAROT_FRENCH_TITLES[cleanKey]) {
			isTarotMajor = true;
			bottomTitleText = TAROT_FRENCH_TITLES[cleanKey];
		} else if (rawVal) {
			bottomTitleText = rawVal.toUpperCase();
		}
	} else {
		// Minor Arcana or Standard Card (e.g. 3 of Diamonds / 3 de Carreau, incluso en mazos de Tarot)
		topCornerText = suitSymbol ? `${rankInitial}${suitSymbol}` : rankInitial;
	}

	return {
		isTarot,
		isTarotMajor,
		isJoker,
		rankInitial,
		suitSymbol,
		topCornerText,
		bottomTitleText
	};
}

/**
 * Formats a card description using its value, suits, and game name.
 * Automatically translates French terms to English for the prompt.
 */
function formatCardDescription(card) {
	if (!card) return "";
	const rawVal  = card.value || "";
	const rawSuit = card.suits || "";
	const rawGame = card.game?.name || "";

	const val  = translateTerm(rawVal, VALUES_FR_TO_EN);
	const suit = translateTerm(rawSuit, SUITS_FR_TO_EN);
	const game = translateTerm(rawGame, GAMES_FR_TO_EN);

	const isJoker = val.toLowerCase() === "joker";
	const isFool  = val.toLowerCase() === "the fool" || suit.toLowerCase() === "the fool";

	if (isJoker) {
		return `Joker card from the ${game} deck`;
	}
	if (isFool) {
		return `The Fool card from the ${game} deck`;
	}
	if (val && suit) {
		return `${val} of ${suit} card from the ${game} deck`;
	}
	if (val) {
		return `${val} card from the ${game} deck`;
	}
	return `card from the ${game} deck`;
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
		          node.inputs.value.includes("aspect ratio")
	);
	if (promptNode) {
		const textConfig = getExactCardTextConfig(baseCard);
		
		const rawSuit = baseCard.suits || "";
		const rawValue = baseCard.value || "";
		const rawGameName = baseCard.game?.name || "";
		
		const suit = translateTerm(rawSuit, SUITS_FR_TO_EN);
		const value = translateTerm(rawValue, VALUES_FR_TO_EN);
		const gameName = translateTerm(rawGameName, GAMES_FR_TO_EN).toLowerCase();
		const suitLower = suit.toLowerCase();
		const suitSymbol = textConfig.suitSymbol || suit;

		let promptValue = promptNode.inputs.value;

		// Construct positive natural language layout description for FLUX with targeted wordless texture protection
		const baseDesc = formatCardDescription(baseCard);
		let textAllowanceProse = "";
		if (textConfig.isTarotMajor) {
			textAllowanceProse = `With the strict exception of the bottom center title panel displaying strictly the French Tarot title "${textConfig.bottomTitleText}"`;
		} else if (textConfig.isJoker) {
			textAllowanceProse = `With the strict exception of the top-left corner index displaying strictly "JOKER"`;
		} else if (textConfig.topCornerText) {
			const allowedStr = textConfig.bottomTitleText 
				? `top-left index displaying strictly "${textConfig.topCornerText}" and bottom title panel displaying strictly "${textConfig.bottomTitleText}"`
				: `top-left index displaying strictly "${textConfig.topCornerText}"`;
			textAllowanceProse = `With the strict exception of the ${allowedStr}`;
		} else {
			textAllowanceProse = `With no exceptions, all text is forbidden and`;
		}

		let layoutProse = "";
		if (textConfig.isTarotMajor) {
			layoutProse = `The Primary Base Card is ${baseDesc}. All four corners are plain, clean, and unprinted. At the bottom center, a single title panel displays strictly the French Tarot title "${textConfig.bottomTitleText}".`;
		} else if (textConfig.isJoker) {
			layoutProse = `The Primary Base Card is a Joker card. The top-left corner displays strictly the word "JOKER". All other corners are plain and unprinted.`;
		} else if (textConfig.topCornerText) {
			let colorProse = "";
			if (suitLower.includes("heart") || suitLower.includes("diamond") || suitLower.includes("♥") || suitLower.includes("♦")) {
				colorProse = " in red ink";
			} else if (suitLower.includes("spade") || suitLower.includes("club") || suitLower.includes("♠") || suitLower.includes("♣")) {
				colorProse = " in black ink";
			}

			const bottomProse = textConfig.bottomTitleText
				? `At the bottom center, a single title panel displays strictly "${textConfig.bottomTitleText}".`
				: `The bottom area flows into continuous background scenery.`;

			layoutProse = `The Primary Base Card is ${baseDesc}. The top-left corner displays strictly the single index "${textConfig.topCornerText}"${colorProse}. ${bottomProse} The top-right, bottom-left, and bottom-right corners are plain and unprinted.`;
		} else {
			layoutProse = `The Primary Base Card is ${baseDesc}. The card features a clean artwork layout with plain, unprinted borders.`;
		}

		const naturalProseSuffix = `\n\n${layoutProse} A single, anatomically coherent central figure is seamlessly integrated into a rich, edge-to-edge illustrated environment. The background, clothing, props, and lower sections are filled with continuous atmospheric scenery, flowing abstract motifs, and detailed environmental elements, ensuring no floating body parts or disjointed figures disrupt the layout. ${textAllowanceProse}, all other areas, backgrounds, props, shields, and garments are purely illustrative, featuring wordless painted textures and continuous artistic brushstrokes.`;

		// Find the final concatenation node (node 115) and append the natural prose suffix
		const suffixNode = Object.values(workflow).find(
			(node) => node.class_type === "StringConcatenate" && 
			          typeof node.inputs?.string_b === "string" && 
			          (node.inputs.string_b.includes("illustration style") || node.inputs.string_b.includes("color palette"))
		);

		if (suffixNode) {
			suffixNode.inputs.string_b = suffixNode.inputs.string_b + naturalProseSuffix;
		}

		// Inject clean, natural delimiters between card descriptions (only base card has identity; secondary cards supply visual motifs only)
		if (workflow["98"]) {
			workflow["98"].inputs.delimiter = `. Primary Base Card (${formatCardDescription(baseCard)}): `;
		}
		if (workflow["101"] && otherCards[0]) {
			workflow["101"].inputs.delimiter = `. Visual artwork elements from Secondary Card 2: `;
		}
		if (workflow["102"] && otherCards[1]) {
			workflow["102"].inputs.delimiter = `. Visual artwork elements from Secondary Card 3: `;
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
