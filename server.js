const static = require('node-static');
const file = new static.Server('./public');
const http = require('http');

const server = http.createServer((request, response) => {
    request.addListener('end', () => {
        file.serve(request, response, (e) => {
            if (e) {
                if (e.status === 404) {
                   file.serveFile('/index.html', 200, {}, request, response);
                } else {
                    response.writeHead(e.status, { 'Content-Type': 'text/plain' });
                    response.end(`Error: ${e.message}`);
                }
            }
        });
    }).resume();
});

server.listen(1000, () => {
    console.log('Server running at http://localhost:1000/');
});

module.exports = server;