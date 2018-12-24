const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

const rp = require('request-promise');

const chainOpt = {
    uri: 'http://localhost:3001/blockchain',
    method: 'GET',
    json: true
};

const mineOpt = {
    uri: 'http://localhost:3001/mine',
    method: 'POST',
    json: true
}

rp(chainOpt).then(console.log);
rp(mineOpt).then(console.log);


const transaction = {
    amount: 10, 
    sender: "NNFANSDFHYHTN90A09SNFAS",
    recipient: "IUW99N0A90WENNU234UFAW"
}

rp({
    uri: 'http://localhost:3001/transaction/broadcast',
    method: 'POST',
    body: transaction,
    json: true
}).then(console.log);

rp(mineOpt).then(console.log);
rp(mineOpt).then(console.log);
rp(mineOpt).then(console.log);

let bc1;
rp(chainOpt).then(data=>{
    bc1 = data;
});
///////////////////////////

console.log('VALID:', bitcoin.chainIsValid(bc1.chain));