const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");

const bitcoin = new Blockchain();

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

app.get("/mine", function(req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: lastBlock.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previousHash, currentBlockData);
    const powHash = bitcoin.hashBlock(previousHash, currentBlockData, nonce);
    const newblock = bitcoin.createNewBlock(nonce, previousHash, powHash);
    return res.json({note: "nre block mined successfully", block: newBlock});
});

app.listen(3000, () => {
    console.log("listening on port 3000...");
});