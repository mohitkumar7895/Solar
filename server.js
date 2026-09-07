require('dotenv').config();
const http = require('http');
const apiHandler = require('./api/data-api.js');

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        if (body) {
            try { req.body = JSON.parse(body); }
            catch (e) { req.body = body; }
        }
        
        // Polyfill res.status and res.json for Vercel compatibility
        res.status = (code) => { res.statusCode = code; return res; };
        const origEnd = res.end.bind(res);
        res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            origEnd(JSON.stringify(data));
        };
        res.send = (data) => { origEnd(data); };
        
        apiHandler(req, res).catch(err => {
            console.error('Handler error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            origEnd(JSON.stringify({ error: err.message }));
        });
    });
});

server.listen(3001, () => {
    console.log("Local API server running on http://localhost:3001");
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_NAME:", process.env.DB_NAME);
});
