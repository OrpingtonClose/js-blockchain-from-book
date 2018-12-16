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

app.get("/blockchain", function(req, res) {
    res.send(bitcoin);
});

app.post("/transaction", function(req, res) {
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
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

app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
        bitcoin.networkNodes.push(newNodeUrl);
    } 
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: newNodeUrl + "/register-node",
            method: 'POST',
            body: {newNodeUrl},
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    });
    Promise.all(regNodesPromises).then(data =>{
        const requestOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: "POST",
            body: {allNewtorkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
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

const port = process.argv[2] || 3000;
app.listen(port, () => {
    console.log(`listening on port ${port}...`);
});