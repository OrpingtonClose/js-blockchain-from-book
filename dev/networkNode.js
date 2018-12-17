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

function registerUrl(newNodeUrl) {
    /*if (!newNodeUrl) {
        throw("empty url passed!");
    }*/
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    //console.log(`===all===${newNodeUrl}`);
    if (nodeNotAlreadyPresent && notCurrentNode) {
//        console.trace(`===accepted===${newNodeUrl}`);
        bitcoin.networkNodes.push(newNodeUrl);
    } 
    //console.log(bitcoin.networkNodes);
}

app.get("/", function(req, res) {
    res.status(200).send('ok');
});

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

app.post('/echo', function(req, res) {
    const {parse, stringify} = require('flatted/cjs');
    return res.send(stringify(parse(req)));
});

app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    //console.log(`/register-and-broadcast-node ==>${newNodeUrl}`);
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
        bitcoin.networkNodes.push(newNodeUrl);
    }
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + "/register-node",
            method: 'POST',
            body: {newNodeUrl},
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    });
    Promise.all(regNodesPromises).then(data =>{
        //console.log(`[...bitcoin.networkNodes, bitcoin.currentNodeUrl] => ${[...bitcoin.networkNodes, bitcoin.currentNodeUrl]}`);
        const requestOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
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
    registerUrl(newNodeUrl);
    /*
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
    } 
    */
    return res.json({note: "new node registered successfully"});
});

app.post('/register-nodes-bulk', function(req, res){
    const allNetworkNodes = req.body.allNetworkNodes;
    //console.log('   const allNetworkNodes = req.body.allNetworkNodes;');
    //console.log(allNetworkNodes);
    allNetworkNodes.forEach( newNodeUrl => {
        //console.log(`allNetworkNodes.forEach( newNodeUrl => {${newNodeUrl}`);
        registerUrl(newNodeUrl);
        /*
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode) {
            console.log(`===${newNodeUrl}`);
            bitcoin.networkNodes.push(newNodeUrl);
        }
        */
    });
    return res.json({note: "Bulk registration successful."});
});

function start(port) {
    return app.listen(port, () => {
        console.log(`listening on port ${port}...`);
    });
}

if (module.parent) {
    module.exports = start;
} else {
    const port = process.argv[2] || 3000;
    start(port);
}



