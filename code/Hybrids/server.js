const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
	".html": "text/html",
	".css": "text/css",
	".js": "application/javascript",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".gif": "image/gif",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".ico": "image/x-icon",
};

// In-memory state sync object
let currentState = {
	type: "STATE_CHANGE",
	state: "IDLE", // "IDLE", "EXPLORE", "GENERATING", "RESULT"
	selectedCards: [],
	baseCardId: null,
	progress: 0,
	hybridPayload: null, // { base64, id, name }
	timestamp: Date.now(),
};

const server = http.createServer((req, res) => {
	// Proxy remote images to bypass CORS policies in browser canvas operations
	if (req.url.startsWith("/proxy-image")) {
		const targetUrl = new URL(
			req.url,
			`http://${req.headers.host}`,
		).searchParams.get("url");
		if (!targetUrl) {
			res.writeHead(400);
			return res.end("Missing url parameter");
		}

		const protocol = targetUrl.startsWith("https")
			? require("https")
			: require("http");
		protocol
			.get(targetUrl, (proxyRes) => {
				res.writeHead(proxyRes.statusCode, {
					"Content-Type": proxyRes.headers["content-type"] || "image/jpeg",
					"Access-Control-Allow-Origin": "*",
				});
				proxyRes.pipe(res);
			})
			.on("error", (e) => {
				res.writeHead(500);
				res.end(`Proxy error: ${e.message}`);
			});
		return;
	}

	// Proxy local ComfyUI requests to bypass CORS policies in browser
	if (req.url.startsWith("/comfy-proxy")) {
		const targetPath = req.url.substring("/comfy-proxy".length);
		const comfyUrl = `http://127.0.0.1:8188${targetPath}`;

		const parsedUrl = new URL(comfyUrl);
		const options = {
			hostname: parsedUrl.hostname,
			port: parsedUrl.port || 8188,
			path: parsedUrl.pathname + parsedUrl.search,
			method: req.method,
			headers: {
				...req.headers,
			},
		};

		const headersToStrip = [
			"host",
			"origin",
			"referer",
			"sec-fetch-dest",
			"sec-fetch-mode",
			"sec-fetch-site",
			"sec-fetch-user",
		];
		headersToStrip.forEach((h) => {
			delete options.headers[h];
			delete options.headers[h.toLowerCase()];
		});

		const httpLib = require("http");
		const proxyReq = httpLib.request(options, (proxyRes) => {
			res.writeHead(proxyRes.statusCode, {
				...proxyRes.headers,
				"Access-Control-Allow-Origin": "*",
			});
			proxyRes.pipe(res);
		});

		proxyReq.on("error", (e) => {
			console.error("ComfyUI Proxy error:", e.message);
			res.writeHead(502);
			res.end(`ComfyUI Proxy error: ${e.message}`);
		});

		req.pipe(proxyReq);
		return;
	}

	// Route alias for /display -> display.html
	let reqPath = req.url.split("?")[0];
	if (reqPath === "/display") {
		reqPath = "/display.html";
	}

	// Normalize URL path to prevent directory traversal
	let filePath = path.join(PUBLIC_DIR, reqPath);
	if (filePath.endsWith(path.sep)) {
		filePath = path.join(filePath, "index.html");
	}

	const ext = path.extname(filePath).toLowerCase();
	const contentType = MIME_TYPES[ext] || "application/octet-stream";

	fs.readFile(filePath, (err, content) => {
		if (err) {
			if (err.code === "ENOENT") {
				res.writeHead(404, { "Content-Type": "text/html" });
				res.end("<h1>404 Not Found</h1>", "utf-8");
			} else {
				res.writeHead(500);
				res.end(`Server Error: ${err.code}`);
			}
		} else {
			res.writeHead(200, {
				"Content-Type": contentType,
				"Cache-Control": "no-store",
			});
			res.end(content, "utf-8");
		}
	});
});

// Setup WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
	console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

	// Immediately sync current state to new client
	ws.send(JSON.stringify(currentState));

	ws.on("message", (message) => {
		try {
			const data = JSON.parse(message.toString());

			// Respond to PING heartbeat without broadcasting
			if (data.type === "PING") {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: "PONG" }));
				}
				return;
			}
			
			// Update in-memory state
			if (data.type === "STATE_CHANGE") {
				currentState.state = data.state || currentState.state;
				if (data.selectedCards) currentState.selectedCards = data.selectedCards;
				if (data.baseCardId !== undefined) currentState.baseCardId = data.baseCardId;
				if (data.hybridPayload) currentState.hybridPayload = data.hybridPayload;
				currentState.timestamp = Date.now();
			} else if (data.type === "HYBRID_GENERATED") {
				currentState.state = "RESULT";
				currentState.hybridPayload = data.payload || data;
				currentState.timestamp = Date.now();
			} else if (data.type === "HOLDING_PROGRESS") {
				currentState.progress = data.progress || 0;
			} else if (data.type === "CARDS_UPDATED") {
				currentState.selectedCards = data.selectedCards || [];
				currentState.baseCardId = data.baseCardId || null;
			}

			// Broadcast message to all connected clients
			const broadcastPayload = JSON.stringify(data);
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(broadcastPayload);
				}
			});
		} catch (err) {
			console.error("[WS] Error processing message:", err);
		}
	});

	ws.on("close", () => {
		console.log("[WS] Client disconnected");
	});

	ws.on("error", (err) => {
		console.error("[WS] Client error:", err.message);
	});
});

server.listen(PORT, "0.0.0.0", () => {
	console.log(`\n======================================================`);
	console.log(`Hybrids Server running on http://localhost:${PORT}/`);
	console.log(`App 1 (Control / Brain):  http://localhost:${PORT}/index.html`);
	console.log(`App 2 (Exhibition Display): http://localhost:${PORT}/display.html`);
	console.log(`WebSocket Server active at ws://localhost:${PORT}/`);
	console.log(`======================================================\n`);
});
