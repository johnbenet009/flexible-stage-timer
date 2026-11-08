const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { WebSocketServer } = require('ws');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.sqlite': 'application/octet-stream',
};

let server = null;
let wss = null;
let activePort = null;
let publicDir = '';
let accessPin = '';
let snapshot = {};
let broadcastTimer = null;
let heartbeatTimer = null;
let onCommand = () => {};
let onClientsChanged = () => {};

const getLanUrls = (port) => {
    const interfaces = os.networkInterfaces();
    const urls = [];
    for (const [name, addresses] of Object.entries(interfaces)) {
        for (const address of addresses || []) {
            if (address.family === 'IPv4' && !address.internal) {
                urls.push({ interface: name, address: address.address, url: `http://${address.address}:${port}` });
            }
        }
    }
    return urls;
};

const authenticatedClients = () => {
    let count = 0;
    if (wss) for (const client of wss.clients) if (client.authed && client.readyState === 1) count += 1;
    return count;
};

const sendJson = (client, payload) => {
    if (client.readyState === 1) {
        try { client.send(JSON.stringify(payload)); } catch {}
    }
};

const broadcastState = () => {
    broadcastTimer = null;
    if (!wss) return;
    const message = JSON.stringify({ type: 'state', state: snapshot });
    for (const client of wss.clients) {
        if (client.authed && client.readyState === 1) {
            try { client.send(message); } catch {}
        }
    }
};

const publish = (partial) => {
    if (!partial || typeof partial !== 'object') return;
    snapshot = { ...snapshot, ...partial, serverTime: Date.now() };
    if (!broadcastTimer) broadcastTimer = setTimeout(broadcastState, 120);
};

const handleRequest = (request, response) => {
    try {
        const requestUrl = new URL(request.url, 'http://localhost');
        let pathname = decodeURIComponent(requestUrl.pathname);
        if (pathname === '/') pathname = '/index.html';
        const filePath = path.normalize(path.join(publicDir, pathname));
        if (!filePath.startsWith(path.normalize(publicDir + path.sep)) && filePath !== path.normalize(publicDir)) {
            response.writeHead(403); response.end('Forbidden'); return;
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            response.writeHead(404); response.end('Not found'); return;
        }
        const ext = path.extname(filePath).toLowerCase();
        response.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(response);
    } catch {
        response.writeHead(500); response.end('Server error');
    }
};

const listenOnPort = (preferredPort) => new Promise((resolve, reject) => {
    let attempt = 0;
    const tryListen = (port) => {
        server.once('error', (error) => {
            if (error.code === 'EADDRINUSE' && attempt < 20) {
                attempt += 1;
                server.removeAllListeners('error');
                tryListen(port + 1);
            } else {
                reject(error);
            }
        });
        server.listen(port, '0.0.0.0', () => {
            server.removeAllListeners('error');
            server.on('error', (error) => console.error('Remote server error:', error));
            resolve(port);
        });
    };
    tryListen(preferredPort);
});

const start = async ({ directory, port = 9174, pin = '' } = {}) => {
    if (server) return status();
    publicDir = directory;
    accessPin = typeof pin === 'string' ? pin : '';
    server = http.createServer(handleRequest);
    activePort = await listenOnPort(Number(port) || 9174);

    wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 * 1024 });
    wss.on('connection', (client) => {
        client.authed = !accessPin;
        client.alive = true;
        client.on('pong', () => { client.alive = true; });
        sendJson(client, { type: 'auth', required: Boolean(accessPin), ok: client.authed });
        if (client.authed) {
            sendJson(client, { type: 'state', state: snapshot });
            onClientsChanged(authenticatedClients());
        }
        client.on('message', (raw) => {
            let message;
            try { message = JSON.parse(raw.toString()); } catch { return; }
            if (message.type === 'hello') {
                client.authed = !accessPin || message.pin === accessPin;
                sendJson(client, { type: 'auth', required: Boolean(accessPin), ok: client.authed });
                if (client.authed) sendJson(client, { type: 'state', state: snapshot });
                onClientsChanged(authenticatedClients());
                return;
            }
            if (message.type === 'command' && client.authed && message.command && typeof message.command.action === 'string') {
                onCommand(message.command);
            }
        });
        client.on('close', () => onClientsChanged(authenticatedClients()));
        client.on('error', () => {});
    });

    heartbeatTimer = setInterval(() => {
        if (!wss) return;
        for (const client of wss.clients) {
            if (!client.alive) { try { client.terminate(); } catch {} continue; }
            client.alive = false;
            try { client.ping(); } catch {}
        }
    }, 30000);

    return status();
};

const stop = () => {
    if (broadcastTimer) { clearTimeout(broadcastTimer); broadcastTimer = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (wss) {
        for (const client of wss.clients) { try { client.terminate(); } catch {} }
        try { wss.close(); } catch {}
        wss = null;
    }
    if (server) {
        try { server.close(); } catch {}
        server = null;
    }
    activePort = null;
    onClientsChanged(0);
    return status();
};

const setPin = (pin) => {
    accessPin = typeof pin === 'string' ? pin.trim() : '';
    if (wss) {
        for (const client of wss.clients) {
            if (!accessPin) {
                client.authed = true;
                sendJson(client, { type: 'auth', required: false, ok: true });
                sendJson(client, { type: 'state', state: snapshot });
            } else if (client.authed) {
                client.authed = false;
                sendJson(client, { type: 'auth', required: true, ok: false });
            }
        }
        onClientsChanged(authenticatedClients());
    }
    return status();
};

const status = () => ({
    running: Boolean(server),
    port: activePort,
    urls: activePort ? getLanUrls(activePort) : [],
    clients: authenticatedClients(),
    pinEnabled: Boolean(accessPin),
});

module.exports = {
    start,
    stop,
    publish,
    setPin,
    status,
    setHandlers: (handlers) => {
        if (handlers.onCommand) onCommand = handlers.onCommand;
        if (handlers.onClientsChanged) onClientsChanged = handlers.onClientsChanged;
    },
};