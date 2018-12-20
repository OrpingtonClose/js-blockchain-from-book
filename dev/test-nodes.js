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
    
    it.only('register and broadcast transaction', function(done) {
        let urls = allServers.map(server => `http://localhost:${server.address().port}`);
        const transactionToSend = {
            amount: 100, 
            sender: "ABC", 
            recipient: "XYZ"
        };
        const rq = () => request(broadcastServer);
        Promise.all(urls.map(url=>{
            return rq().post('/register-and-broadcast-node')
                       .send({newNodeUrl: url});
        })).catch(err=>{
            done(err);
        }).then(date=>{
            Promise.all(rq().post('/transaction/broadcast').send(transactionToSend));
        }).catch(err=>{
            done(err);
        }).then(date=>{
            Promise.all(allServers.map(server=>{
                return request(server).get('/blockchain').end( (err, res) => {
                    console.log(res.body);
                });
            }));
            request(broadcastServer).get('/blockchain').then(res=>{
                console.log(res.body);
            }).cache(err=>{
                console.log(err);
            });
            done();
        });

        //done();
        // rq().post('/transaction/broadcast')
        //     .send(transactionToSend)
        //     .end();
        // .catch(err=>{
        //     done(err);
        // }).then(data=>{
        // })
        // done();
        //.catch(err=>{
        //     done(err);
        // }).then(data=>{
            // Promise.all(allServers.map(server=>{
            //     return request(server).get('/blockchain').then(res=>{
            //         return res.body.pendingTransactions;
            //         // let pendingTransactions = res.body.pendingTransactions;
            //         // expect(pendingTransactions).to.have.lengthOf(1);
            //         // let pendingTransaction = pendingTransactions[0];
            //         // Object.keys(transactionToSend).forEach(key=>{
            //         //     expect(pendingTransaction[key]).to.be.equal(transactionToSend[key]);
            //         //     console.log(pendingTransaction);
            //         // });
            //     }).then(data=>{
            //         //console.log(data);
            //     });
            // })).then(data=>{
            //     done();
            // }).catch(err=>{
            //     done(err);
            // });
        // });
        
        
        //    request(broadcastServer).post('/transaction/broadcast')
        //                            .send(transactionToSend)

        console.log("================");
        //.then(data=>{
        //    request(broadcastServer).post('/transaction/broadcast')
        //                            .send(transactionToSend)
                                    // .then(data=>{
                                    //     allServers.forEach(server=>{
                                    //         request(server).get('/blockchain').end( (err, res) => {
                                    //             console.log(err);
                                    //         });
                                    //     });
                                        //console.log(data);
                                        // allServers.forEach(server=>{
                                        //     request(server).get('/blockchain')
                                        //                    .then(data=>{
                                        //         console.log("|||||||||||||||||||||||||||||");
                                        //         let pendingTransactions = data.body.pendingTransactions;
                                        //         expect(pendingTransactions).to.have.lengthOf(2);
                                        //         expect(data.body.pendingTransactions[0]).to.be.deep.equal(transactionToSend);
                                        //     });
                                        // });
                                    // }).then(data=>{
                                    //     done();
                                    // }).catch(err=>{
                                    //     done(err);
                                    // });
        // }).then(data=>{
        //     console.log("|||||||||||||||||||||||||||||");
        //     Promise.all(allServers.map(server=>{
        //         request(server).get('/blockchain').end( (err, res) => {
        //             console.log(res.body);
        //         });
        //     }))
            // allServers.forEach(server=>{
            //     request(server).get('/blockchain').end( (err, res) => {
            //         console.log(res);
            //     });
            // });
        // }).then(data=>{
        //     done()
        // }).catch(err=>{
        //     done(err)
        // });;
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