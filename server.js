const http = require('http');
const apiHandler = require('./api/data-api.js');

const server = http.createServer((req, res) => {
    // Vercel polyfills
    req.query = new URL(req.url, `http://${req.headers.host}`).searchParams;
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        if (body) {
            try { req.body = JSON.parse(body); }
            catch (e) { req.body = body; }
        }
        
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        };
        res.send = (data) => { res.end(data); };
        
        apiHandler(req, res).catch(err => {
            console.error(err);
            res.status(500).json({ error: err.message });
        });
    });
});

server.listen(3001, () => {
    console.log("Local API server running on port 3001");
});
