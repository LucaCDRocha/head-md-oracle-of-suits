window.ENV = {
	GEMINI_API_KEY: "YOURAPIKEY",
	API_BASE: "YOURSITE",
	DEBUG: false,
};

// Configuration and environment variables for ES6 modules
const env = typeof window !== "undefined" && window.ENV ? window.ENV : {};
const API_BASE = window.API_BASE || env.API_BASE || "";
const GEMINI_API_KEY = window.GEMINI_API_KEY || env.GEMINI_API_KEY || "";
const DEBUG = window.DEBUG !== undefined ? window.DEBUG : env.DEBUG !== undefined ? env.DEBUG : false;

console.log("Generative key present:", !!GEMINI_API_KEY);
console.log("Debug mode:", DEBUG);

export { API_BASE, GEMINI_API_KEY, DEBUG };
