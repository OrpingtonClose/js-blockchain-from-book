const uuid = require("uuid/v1");
const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const Blockchain = require("./blockchain");

const bitcoin = new Blockchain();
const nodeAddress = uuid().split("-").join("");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// const morganBody = require("morgan-body");
// morganBody(app);

app.get("/", function(req, res) {
    res.status(200).send('ok');
});

app.get("/blockchain", function(req, res) {
    res.send(bitcoin);
});

app.post("/transaction", function(req, res) {
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Transaction will be added in block ${blockIndex}`});
});

app.post("/mine", function(req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousHash = lastBlock['hash'];
    bitcoin.createNewTransaction(12.5, "00", nodeAddress);   
    const currentBlockData = {
        transactions: lastBlock.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previousHash, currentBlockData);
    const powHash = bitcoin.hashBlock(previousHash, currentBlockData, nonce);
    const newBlock = bitcoin.createNewBlock(nonce, previousHash, powHash);

    return res.json({note: "block mined successfully", block: newBlock});
});

app.post('/echo', function(req, res) {
    const {parse, stringify} = require('flatted/cjs');
    return res.send(stringify(parse(req)));
});

app.post("/register-and-broadcast-node", function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
        bitcoin.networkNodes.push(newNodeUrl);
    }
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/register-node",
            method: "POST",
            body: {newNodeUrl},
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises).then(data =>{
        const requestOptions = {
            uri: newNodeUrl + "/register-nodes-bulk",
            method: "POST",
            body: {allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json: true
        };
        return rp(requestOptions);
    }).then(data=>{
        return res.json({note: "New node registered with network successfully"});
    });
});

app.post('/register-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
    } 
    return res.json({note: "new node registered successfully"});
});

app.post('/register-nodes-bulk', function(req, res){
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach( newNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) {
            bitcoin.networkNodes.push(newNodeUrl);
        }
    });
    return res.json({note: "Bulk registration successful."});
});

app.post('/transaction/broadcast', function(req, res){
    const {amount, sender, recipient} = req.body;
    const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true   
        };
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises).then(data=>{
        res.json({note: 'Transaction created and broadcast successfully.'});
    });
/*
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/register-node",
            method: 'POST',
            body: {newNodeUrl},
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    });
*/

});

function start(port) {
    const listener = app.listen(port, () => {
        bitcoin.currentNodeUrl = `http://[${listener.address().address}]:${listener.address().port}`;
        //console.log(`listening on port ${port}...`);
    });
    return listener;
}

if (module.parent) {
    module.exports = start;
} else {
    const port = process.argv[2] || 3000;
    start(port);
}



