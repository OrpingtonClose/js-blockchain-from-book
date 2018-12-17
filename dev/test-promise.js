const request = require('supertest');
const should = require('chai').should();
//const expect = require('expect');
const expect = require('chai').expect;
describe("check promises in tests", ()=>{
    it("should fail for one case", (done)=>{
        const urls = [];
        urls.push('https://a.4cdn.org/biz/catalog.json');
        urls.push('https://samples.openweathermap.org/data/2.5/weather?q=London,uk&appid=b6907d289e10d714a6e88b30761fae22');
        urls.push('http://api.worldbank.org/v2/countries/all/indicators/SP.POP.TOTL?format=json');

        var promises = urls.map(data => {
            return new Promise((resolve, reject)=>{
                request(data).get('').end((err, res) =>{
                    return resolve(res);
                });
            }).then(result=>{
                //expect(result.body).to.be.an('array');
                result.body.should.be.an('array');
            }).catch(err=>{
                done(err);
            });//.then(delay =>{done();});
        });

        Promise.all(promises);
    });
    const trivialCases = [];
    trivialCases.push(function theFirst_fun_of_the_suit(){return 1 === 1});
    trivialCases.push(function second_fun_of_the_suit(){return "aaa" === "aaa"});
    trivialCases.push(function third_fun_of_the_suit(){return 90 === 99});
    trivialCases.push(function isArray_fun_of_the_suit(){return Array.isArray([3, 4, 5])});

    trivialCases.forEach(fun=>{
        it(`should execute trivial test case ${fun.name}`, done=>{
            fun().should.be.true;
            done();
        });
    });
});