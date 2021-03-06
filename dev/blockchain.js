const uuid = require("uuid/v1");
const sha256 = require('sha256');
const fsdb = require('./fsdb');
const db = new fsdb(true);

function Blockchain(currentNodeUrl) {
    this.chain = [];
    this.currentNodeUrl = currentNodeUrl;
    this.pendingTransactions = [];
    this.createNewBlock(100, "0", "0");
    this.networkNodes = [];
}

Blockchain.prototype.__defineGetter__("chain", function(){
    let block = db.get("block.last");
    let previousBlock;
    var chain = [];
    let sameBlockFetched;
    while (block && !sameBlockFetched) {
        chain.unshift(block);
        previousBlock = block;
        block = db.get(`block.${block.previousBlockHash}`);
        sameBlockFetched = JSON.stringify(block) === JSON.stringify(previousBlock);
    }
    return chain;
});
Blockchain.prototype.__defineSetter__("chain", function(value){
    //no validation for now
    for (let blockNum = 0; blockNum < value.length; blockNum += 1) {
        db.put(`block.${value.hash}`, value[blockNum]);
        if (blockNum === (value.length - 1)) {
            db.put(`block.last`, value[blockNum]);
        }
    }
});
Blockchain.prototype.__defineGetter__("pendingTransactions", function(){
    return db.get(`transactions.pending.${sha256(this.currentNodeUrl)}`);
});
Blockchain.prototype.__defineSetter__("pendingTransactions", function(value){
    db.put(`transactions.pending.${sha256(this.currentNodeUrl)}`, value);
});

Blockchain.prototype.__defineGetter__("networkNodes", function(){
    return db.get(`node.url.${sha256(this.currentNodeUrl)}`);
});
Blockchain.prototype.__defineSetter__("networkNodes", function(value){
    db.put(`node.url.${sha256(this.currentNodeUrl)}`, value);
});

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

    this.chain = this.chain.concat(newBlock);

    db.put(`block.last`, newBlock);
    db.put(`block.${hash}`, newBlock);
    return newBlock;
}

Blockchain.prototype.getLastBlock = function () {
    return db.get(`block.last`);
}

Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };
    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    const {pendingTransactions} = this;
    pendingTransactions.push(transactionObj);
    this.pendingTransactions = pendingTransactions;
    return this.getLastBlock()['index'] + 1;
};

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

        if (powResults[zerosUpFront] ) {
            powResults[zerosUpFront] += 1;    
        } else {
            powResults[zerosUpFront] = 1;
        }
        nonce += 1;
    }
    return nonce - 1;
}

Blockchain.prototype.chainIsValid = function(blockchain) {
    let validBlock = true;
    let genesisBlock = blockchain[0];
    let correctTransactions = genesisBlock.transactions.length === 0;
    if (!correctTransactions) {
        console.log(`genesisBlock.transactions.length === 0;`)
        console.log(`${genesisBlock.transactions.length} === 0;`)
    }
    validBlock = validBlock && correctTransactions;
    let correctNonce = this.chain[0]['nonce'] === genesisBlock['nonce'];
    if (!correctNonce) {
        console.log(`this.chain[0]['nonce'] === genesisBlock['nonce']`)
        console.log(`${this.chain[0]['nonce']} === ${genesisBlock['nonce']}`)
    }
    validBlock = validBlock && correctNonce;
    let correctPreviousBlockHash = this.chain[0]['previousBlockHash'] === genesisBlock['previousBlockHash'];
    if (!correctPreviousBlockHash) {
        console.log(`this.chain[0]['previousBlockHash'] === genesisBlock['previousBlockHash'];`)
        console.log(`${this.chain[0]['previousBlockHash']} === ${genesisBlock['previousBlockHash']};`)
    }    
    validBlock = validBlock && correctPreviousBlockHash;
    let correctHash = this.chain[0]['hash'] === genesisBlock['hash'];
    if (!correctHash) {
        console.log(`this.chain[0]['hash'] === genesisBlock['hash'];`)
        console.log(`${this.chain[0]['hash']} === ${genesisBlock['hash']};`)
    }    
    validBlock = validBlock && correctHash;
    for (let n = 1; n < blockchain.length; n += 1) {
        let blockToValidate = blockchain[n];
        let prevBlockToValidate = blockchain[n - 1];
        let correctHashMatch = prevBlockToValidate.hash === blockToValidate.previousBlockHash;
        if (!correctHashMatch) {
            console.log(`prevBlockToValidate.hash === blockToValidate.previousBlockHash;`)
            console.log(`${prevBlockToValidate.hash} === ${blockToValidate.previousBlockHash};`)
        }            
        validBlock = validBlock && correctHashMatch;
        let transactionsToValidate = {transactions: blockToValidate.transactions, index: blockToValidate.index};
        let hashedBlock = this.hashBlock(blockToValidate.previousBlockHash, transactionsToValidate, blockToValidate.nonce);
        let correctMinedHash = hashedBlock === blockToValidate.hash;
        if (!correctMinedHash) {
            console.log(`transactionsToValidate ${JSON.stringify(transactionsToValidate)}`);
            console.log(`hashedBlock === blockToValidate.hash;`);
            console.log(`${hashedBlock} === ${blockToValidate.hash};`);
        }    
        validBlock = validBlock && correctMinedHash;
        let correctDifficulty = blockToValidate.hash.substring(0, 4) === "0000";
        if (!correctDifficulty) {
            console.log(`blockToValidate.hash.substring(0, 4) === "0000";`)
            console.log(`${blockToValidate.hash.substring(0, 4)} === "0000";`)
        }    
        validBlock = validBlock && correctDifficulty;
    }
    return validBlock;
}

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) {
            correctBlock = block;
        }
    });
    return correctBlock;
}

Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;
    for (let block = 0; block < this.chain.length; block += 1) {
        let transactions = this.chain[block].transactions;
        for (let transaction = 0; transaction < transactions.length; transaction += 1 ) {
            if (transactions[transaction].transactionId === transactionId) {
                correctTransaction = transactions[transaction];
                correctBlock = this.chain[block];
            }
        }
    }
    return {
        transaction: correctTransaction,
        block: correctBlock
    };
}

Blockchain.prototype.getAddressData = function(address) {
    let transactionsFound = [];
    let balance = 0;
    for (let block = 0; block < this.chain.length; block += 1) {
        let transactions = this.chain[block].transactions;
        for (let transaction = 0; transaction < transactions.length; transaction += 1 ) {
            let {sender, recipient} = transactions[transaction];
            if (sender === address) {
                balance -= transactions[transaction].amount;
                transactionsFound.push(transactions[transaction]);
            }
            if (recipient === address) {
                balance += transactions[transaction].amount;
                transactionsFound.push(transactions[transaction]);
            }            
        }
    }   
    return {
        addressTransactions: transactionsFound,
        addressBalance: balance
    };
}

module.exports = Blockchain;