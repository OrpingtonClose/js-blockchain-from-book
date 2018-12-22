const request = require('supertest');
//const shoud = require('should');
const chai = require("chai");
const shoud = chai.should();
const expect = chai.expect;

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
    
    it('register and broadcast transaction', function(done) {
        let urls = allServers.map(server => `http://[${server.address().address}]:${server.address().port}`);
        let broadcastUrl = `http://[${broadcastServer.address().address}]:${broadcastServer.address().port}`;
        const transactionToSend = {
            amount: 100, 
            sender: "ABC", 
            recipient: "XYZ"
        };
        const rp = require("request-promise");

        (async function() {
            await Promise.all(urls.map(url => {
                const requestOptions = {
                    uri: broadcastUrl + "/register-and-broadcast-node",
                    method: "POST",
                    body: {newNodeUrl: url},
                    json: true
                };
                return rp(requestOptions);
            })).catch(err=>{
                done(err);
            })            
            await rp({uri: urls[2] + "/transaction/broadcast",
                method: "POST",
                body: transactionToSend,
                json: true
            }).catch(err=>{
                done(err);
            });     
            await Promise.all(urls.map(function(url) {
                return rp({uri: url + "/blockchain",
                    method: "GET",
                    json: true
                }).then(res=>{
                    let pendingTransaction = res.pendingTransactions[0];
                    expect(pendingTransaction.amount).to.be.equal(transactionToSend.amount);
                    expect(pendingTransaction.sender).to.be.equal(transactionToSend.sender);
                    expect(pendingTransaction.recipient).to.be.equal(transactionToSend.recipient);
                });
            })).then(data=>{
                done();
            });      
        })();
    });

    it('register and brodcast node', function(done) {
        let newNodeUrl = `http://localhost:${newServer.address().port}`;
        request(broadcastServer).post('/register-node')
                                .send({newNodeUrl})
                                .then(res=>{
                                    request(broadcastServer).get('/blockchain').then(blockchainRes=>{
                                        expect(blockchainRes.body.networkNodes).to.be.an('array').that.includes(newNodeUrl);
                                    }).then(data=>{
                                        done();
                                    }).catch(err=>{
                                        done(err);
                                    });
                                });
    });
    

    it('register and brodcast single node', function testSlash(done) {
        let newNodeUrl = `http://localhost:${newServer.address().port}`;
        request(broadcastServer).post('/register-node')
                                .send({newNodeUrl})
                                .then(res=>{
                                    request(broadcastServer).get('/blockchain').then(blockchainRes=>{
                                        expect(blockchainRes.body.networkNodes).to.be.an('array').that.includes(newNodeUrl);
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
                                        expect(blockchainRes.body.networkNodes).to.be.an('array').that.includes.members(allNetworkNodes);
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
                    expect(blockchainRes.body.networkNodes).to.include.members(allUrls);
                    allUrls.should.include.members(blockchainRes.body.networkNodes);
                }).then(data=>{
                    done();
                }).catch(err=>{
                    done(err);
                });
            });
        });
    });       
});