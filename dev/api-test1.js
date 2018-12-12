let server;
function startServer() {
    return new Promise(resolve => {
        var express = require('express');
        var app = express();

        app.get('/', function(req, res) {
            res.send("Hi there!")
        });

        server = app.listen(3000);
    });
}
async function start() {
    console.log("hello");
    await startServer();
}
start();

setTimeout(() => {
    require("request")("http://localhost:3000", (error, response, body) => {
        console.log("fetched body:");
        console.log(body);
        console.log("closing server");
        server.close();
    });
}, 2000);
