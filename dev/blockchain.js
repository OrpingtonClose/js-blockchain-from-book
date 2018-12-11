/*
class Blockchain() {
    constructor() {
        this.chain = [];
        this.newTransaction = [];
    }
}
*/
const sha256 = require('sha256');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    this.createNewBlock(100, "0", "0");
    console.log("<<<<new chain created>>>>");
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        previousBlockHash: previousBlockHash,
        hash: hash
    }

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient
    };
    this.pendingTransactions.push(newTransaction);
    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function (previousblockHash, currentblockData, nonce) {
    const dataAsString = previousblockHash + nonce.toString() + JSON.stringify(currentblockData);
    const hash = sha256(dataAsString);
    return hash;
}

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentblockData) {
    let powHash = ""; 
    let nonce = 0;
    let difficulty = 4;
    let prefix = "0".repeat(difficulty);
    let hashStringLength = 64;
    let probeRegex = /^0+/;
    const powResults = [];

    while (powHash.substr(0, 4) !== prefix) {
        powHash = this.hashBlock(previousBlockHash, currentblockData, nonce);
        let zerosUpFront = hashStringLength - powHash.replace(probeRegex, "").length
        //if (zerosUpFront === 1) {console.log(powHash);}

        if (powResults[zerosUpFront] ) {
            powResults[zerosUpFront] += 1;    
        } else {
            powResults[zerosUpFront] = 1;
        }
        nonce += 1;
    }
    console.log(powResults);
    return nonce - 1;
}

module.exports = Blockchain;