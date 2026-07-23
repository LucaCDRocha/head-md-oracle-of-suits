const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = __dirname; // Serves files from the directory where this script is located

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Proxy remote images to bypass CORS policies in browser canvas operations
    if (req.url.startsWith('/proxy-image')) {
        const targetUrl = new URL(req.url, `http://${req.headers.host}`).searchParams.get('url');
        if (!targetUrl) {
            res.writeHead(400);
            return res.end('Missing url parameter');
        }
        
        const protocol = targetUrl.startsWith('https') ? require('https') : require('http');
        protocol.get(targetUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
                'Access-Control-Allow-Origin': '*'
            });
            proxyRes.pipe(res);
        }).on('error', (e) => {
            res.writeHead(500);
            res.end(`Proxy error: ${e.message}`);
        });
        return;
    }

    // Proxy local ComfyUI requests to bypass CORS policies in browser
    if (req.url.startsWith('/comfy-proxy')) {
        const targetPath = req.url.substring('/comfy-proxy'.length);
        const comfyUrl = `http://127.0.0.1:8188${targetPath}`;
        
        const parsedUrl = new URL(comfyUrl);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 8188,
            path: parsedUrl.pathname + parsedUrl.search,
            method: req.method,
            headers: {
                ...req.headers
            }
        };

        // Let Node set the correct host header and strip origin/referer to prevent ComfyUI CORS/CSRF 403 rejections
        const headersToStrip = ['host', 'origin', 'referer', 'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-user'];
        headersToStrip.forEach(h => {
            delete options.headers[h];
            delete options.headers[h.toLowerCase()];
        });
        
        
        const httpLib = require('http');
        const proxyReq = httpLib.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*' // force CORS header
            });
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error("ComfyUI Proxy error:", e.message);
            res.writeHead(502);
            res.end(`ComfyUI Proxy error: ${e.message}`);
        });

        req.pipe(proxyReq);
        return;
    }

    // Normalize URL path to prevent directory traversal
    let filePath = path.join(PUBLIC_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep)) {
        filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-store' // Prevent caching for clean testing
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/ (and on your local network at http://192.168.78.127:${PORT}/)`);
    console.log(`Serving files from: ${PUBLIC_DIR}`);
});
