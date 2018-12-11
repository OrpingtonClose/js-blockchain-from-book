const Blockchain = require("./blockchain");

const assert = require('assert');
const should = require('should');

let bitcoin;
describe('basic blockchain functions', function() {
    const previousBlockHash = '849532FAACDBA345566FFFAACD';
    const currentBlockData = [{
        amount: 1234,
        sender: 'bill',
        recipient: 'jill'
    },{
        amount: 1234,
        sender: 'bill',
        recipient: 'jane'
    },{
        amount: 1234,
        sender: 'bill',
        recipient: 'joe'
    }];  
    describe('pow', function() {
        let nonce;
        let powHash;
        before(() => {
            bitcoin = new Blockchain();
            nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData); 
            powHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
        });
        it('should have genesis block upon creation', function() {
            bitcoin.chain.length.should.be.exactly(1);
        });    
        it('nonce is a number', function() {   
            nonce.should.be.a.Number();    
        });
        it('Should start with 4 zeros', function() {   
            powHash.should.startWith("0000");
        });
        it('Should be 64 characters long', function() {   
            powHash.should.have.length(64);
        });
        it('Should have hexadecimal characters', function() {   
            Array.from(powHash).should.matchEach(/[0-9A-F]/i);
        });
    });
    describe("new blocks", function() {
        before(()=>{
            bitcoin = new Blockchain();
            bitcoin.createNewTransaction(1234, 'bill', 'jill');
            bitcoin.createNewTransaction(1234, 'bill', 'jane');
            bitcoin.createNewTransaction(1234, 'bill', 'joe');
            bitcoin.createNewBlock(2389, 'OIUYTREHKHK', '78s97d4x6dsf');
        });
        it("creating new block should add to chain", function() {
            bitcoin.chain.should.have.length(2);
        });
        it("creating new block should add to chain", function() {
            bitcoin.getLastBlock().transactions.should.have.length(3);
        });
    });
});

//const bitcoin = new Blockchain();
//console.log(bitcoin);
/*

console.log('Proof Of Work');
const powHash = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
console.log(powHash);
console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, powHash));

bitcoin.createNewBlock(2389, 'OIUYTREHKHK', '78s97d4x6dsf');
bitcoin.createNewTransaction(1234, 'bill', 'jill');
bitcoin.createNewTransaction(1234, 'bill', 'jane');
bitcoin.createNewTransaction(1234, 'bill', 'joe');

bitcoin.createNewBlock(2289, 'OIUYTREHOOO', '78s97x4x6dsf');

bitcoin.createNewTransaction(1234, 'jill', 'bill');
bitcoin.createNewTransaction(1234, 'jane', 'bill');
bitcoin.createNewTransaction(1234, 'joe', 'bill');

//console.log(bitcoin);
*/