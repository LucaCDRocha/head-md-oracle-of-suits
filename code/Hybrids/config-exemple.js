window.ENV = {
	GENERATOR_API: "comfyui", // "gemini" or "comfyui"
	GEMINI_API_KEY: "YOURAPIKEY",
	COMFYUI_API_BASE: "/comfy-proxy", // relative path to go through local server proxy (avoids CORS)
	COMFYUI_PROMPT_NODE_ID: 6, // default node ID for positive text prompt in workflow_api.json
	API_BASE: "YOURSITE",
	DEBUG: false,
	DEV_MODE: false,
};

// Configuration and environment variables for ES6 modules
const env = typeof window !== "undefined" && window.ENV ? window.ENV : {};
const API_BASE = window.API_BASE || env.API_BASE || "";
const GEMINI_API_KEY = window.GEMINI_API_KEY || env.GEMINI_API_KEY || "";
const GENERATOR_API = window.GENERATOR_API || env.GENERATOR_API || "comfyui";
const COMFYUI_API_BASE = window.COMFYUI_API_BASE || env.COMFYUI_API_BASE || "/comfy-proxy";
const COMFYUI_PROMPT_NODE_ID = window.COMFYUI_PROMPT_NODE_ID !== undefined ? window.COMFYUI_PROMPT_NODE_ID : env.COMFYUI_PROMPT_NODE_ID !== undefined ? env.COMFYUI_PROMPT_NODE_ID : 6;
const DEBUG = window.DEBUG !== undefined ? window.DEBUG : env.DEBUG !== undefined ? env.DEBUG : false;
const DEV_MODE = window.DEV_MODE !== undefined ? window.DEV_MODE : env.DEV_MODE !== undefined ? env.DEV_MODE : false;

export { API_BASE, GEMINI_API_KEY, GENERATOR_API, COMFYUI_API_BASE, COMFYUI_PROMPT_NODE_ID, DEBUG, DEV_MODE };
