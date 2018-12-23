const request = require('supertest');
//const shoud = require('should');
const chai = require("chai");
const shoud = chai.should();
const expect = chai.expect;
const rp = require("request-promise");

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
        let startServer = function(port) {
            (async function() { await exec(`netstat --numeric-ports --tcp --listening --programs | grep :${port} | awk '{print $7}' | cut -d'/' -f1 | xargs -n 1 kill -9`) })();
            return require('./networkNode')(port);
        }
        
        newServer = startServer(3010);
        broadcastServer = startServer(3011);
        otherServers = [...Array(3).keys()].map(n => n + 3015)
                                           .map(n => startServer(n));
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
            });    
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

    it("mine and broadcast mined block", done => {
        let urls = allServers.map(server => `http://[${server.address().address}]:${server.address().port}`);
        let broadcastUrl = `http://[${broadcastServer.address().address}]:${broadcastServer.address().port}`;

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
            });

            let blockMined;
            await rp({uri: broadcastUrl + "/mine",
                method: "POST",
                json: true
            }).then(data=>{
                blockMined = data.block;
            }).catch(err=>{
                done(err);
            });

            await Promise.all(urls.map(function(url) {
                return rp({uri: url + "/blockchain",
                    method: "GET",
                    json: true
                }).then(res=>{
                    const chain = res.chain;
                    const lastBlock = chain[res.chain.length-1];
                    expect(lastBlock).to.be.deep.equal(blockMined);
                });
            })).then(data=>{
                done();
            }).catch(err=>{
                done(err);
            });
        })();
    });

    it.only("propagate mineing rewards to next block", done => {
        let urls = allServers.map(server => `http://[${server.address().address}]:${server.address().port}`);
        let broadcastUrl = `http://[${broadcastServer.address().address}]:${broadcastServer.address().port}`;

        (async function() {

            // await rp({uri: broadcastUrl + "/register-and-broadcast-node",
            //     method: "POST",
            //     body: {newNodeUrl: urls[0]},
            //     json: true
            // });

            // await rp({uri: broadcastUrl + "/register-and-broadcast-node",
            //     method: "POST",
            //     body: {newNodeUrl: urls[2]},
            //     json: true
            // });

            // await rp({uri: broadcastUrl + "/register-and-broadcast-node",
            //     method: "POST",
            //     body: {newNodeUrl: urls[3]},
            //     json: true
            // });
            
            // await rp({uri: broadcastUrl + "/register-and-broadcast-node",
            //     method: "POST",
            //     body: {newNodeUrl: urls[4]},
            //     json: true
            // });            

            // await Promise.all(urls.map(url => {
            //     const requestOptions = {
            //         uri: broadcastUrl + "/register-and-broadcast-node",
            //         method: "POST",
            //         body: {newNodeUrl: url},
            //         json: true
            //     };
            //     return rp(requestOptions);
            // })).catch(err=>{
            //     done(err);
            // });

            // let blockMined;
            // await rp({
            //     uri: broadcastUrl + "/mine",
            //     method: "POST",
            //     json: true
            // }).then(data=>{
            //     blockMined = data.block;
            // }).catch(err=>{
            //     done(err);
            // });
            
            // let miningNodechain;
            // await rp({
            //     uri:  broadcastUrl + "/blockchain",
            //     method: "GET",
            //     json: true
            // }).then(data=>{
            //     miningNodechain = data;
            // }).catch(err=>{
            //     done(err);
            // });

            await Promise.all(urls.slice(-2).map(function(url) {
                console.log(url + "/blockchain");
                return rp({uri: url + "/blockchain",
                    method: "GET"
                    //json: true
                }).then(res=>{
                    console.log(res);
                    // let referenceTransaction = miningNodechain.pendingTransactions[0];
                    // const pendingTransactions = res.pendingTransactions;
                    // expect(pendingTransactions).to.have.lengthOf(1);
                    // expect(pendingTransactions[0]).to.be.deep.equal(referenceTransaction);
                });
            })).then(data=>{
                done();
            }).catch(err=>{
                done(err);
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