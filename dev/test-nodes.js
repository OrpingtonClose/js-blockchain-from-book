const request = require('supertest');
//const shoud = require('should');
const shoud = require('chai').should();
const expect = require('chai').expect;


describe('is supertest working at all?', function() {
    let server;
    beforeEach(()=>{
        server = require('./networkNode')(3010);
    });
    afterEach(()=>{
        server.close();
    });
    it('responds to /', function testSlash(done) {
        request(server).get('/').expect(200, done);
    });
    it('404 random URL', function testRubbisPath(done) {
        request(server).get('/0dcc9d97-9e98-4e0d-b885-fbcd2c3d349e').expect(404, done);
    });
});

describe('network nodes registration', function() {
    let newServer;
    let broadcastServer;
    let otherServers;
    beforeEach(()=>{
        Object.keys(require.cache).forEach(key=>{
            delete require.cache[key];
        });
        newServer = require('./networkNode')(3010);
        broadcastServer = require('./networkNode')(3011);
        otherServers = [...Array(3).keys()].map(n => n + 3015)
                                           .map(n => require('./networkNode')(n));
        allServers = [newServer, broadcastServer, ...otherServers];
    });
    afterEach((done)=>{
        allServers.forEach(server => server.close()); 
        setTimeout(done, 1000);
    });
    it('no nodes registered at the start', done => {
        var promises = [...otherServers, newServer, broadcastServer].map(server => {
            return new Promise((resolve, reject)=>{
                request(server).get('/blockchain').end((err, res) =>{
                    expect(res.body.networkNodes).to.be.an('array')
                                                 .and.be.empty;
                });
            }).catch(err=>{
                done(err);
            });
        });
        Promise.all(promises);
        done();
    });

    it('register and brodcast single node', function testSlash(done) {
        let newNodeUrl = `http://localhost:${newServer.address().port}`;
        request(broadcastServer).post('/register-node')
                                .send({newNodeUrl})
                                .then(res=>{
                                    request(broadcastServer).get('/blockchain').then(blockchainRes=>{
                                        blockchainRes.body.networkNodes.should.be.an('array').that.includes(newNodeUrl);
                                    }).then(data=>{
                                        done();
                                    }).catch(err=>{
                                        done(err);
                                    });
                                });
    });
    it('register nodes in bulk to a single node WITH NO former nodes registered', done => {
        let allNetworkNodes = otherServers.map(server => `http://localhost:${server.address().port}`);
        request(broadcastServer).post('/register-nodes-bulk')
                                .send({allNetworkNodes})
                                .then(res => {
                                    request(broadcastServer).get('/blockchain').then(blockchainRes=>{
                                        blockchainRes.body.networkNodes.should.be.an('array').that.includes.members(allNetworkNodes);
                                        allNetworkNodes.should.be.an('array').that.includes.members(blockchainRes.body.networkNodes);
                                    }).then(data=>{
                                        done();
                                    }).catch(err=>{
                                        done(err);
                                    });
                                });
    });
    
    it('register bulk to node WITH registereds, all should be visible to the node', done => {
        let initialRegistred = newServer;
        let initialRegistredUrl = `http://localhost:${initialRegistred.address().port}`;
        let otherServerUrls = otherServers.map(server => `http://localhost:${server.address().port}`);
        let allUrls = [...otherServerUrls, initialRegistredUrl];
        let rq = () => request(broadcastServer); 
        rq().post('/register-node').send({newNodeUrl: initialRegistredUrl}).then( res =>{
            rq().post('/register-nodes-bulk').send({allNetworkNodes: otherServerUrls}).then(res=>{
                rq().get('/blockchain').then(blockchainRes=>{
                    blockchainRes.body.networkNodes.should.include.members(allUrls);
                    allUrls.should.that.include.members(blockchainRes.body.networkNodes);
                }).then(data=>{
                    done();
                }).catch(err=>{
                    done(err);
                });
            });
        });
    });       
});


/*
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