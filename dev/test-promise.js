const request = require('supertest');
const chai = require("chai");
const shoud = chai.should();
const expect = chai.expect;

chai.use( (_chai, utils) => {
    utils.addProperty(chai.Assertion.prototype, "either", function() {
        utils.flag(this, "alter_a", true);
    });
    utils.addProperty(chai.Assertion.prototype, "or", function() {
        //pass
    });
    utils.overwriteChainableMethod(chai.Assertion.prototype, "an", function(_super) {
        return function() {
            var orClause = utils.flag(this, "alter_a");
            if (orClause) {
                try {
                    _super.apply(this, arguments);
                }
                catch {
                    utils.flag(this, "alter_a", false);
                }
            } else {
                _super.apply(this, arguments);
            }
        }
    }, function(_super) {
        return function() {
            _super.apply(this, arguments);
        }
    });
});

describe("check promises in tests", ()=>{
    it("check for top level json type to be array or object", (done)=>{
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
                expect(result.body).to.be.either.an('array').or.an('object');
            }).then(data=> {
                done();
            }).catch(err=>{
                done(err);
            });
        });

        Promise.all(promises);
    });
    const trivialCases = [];
    trivialCases.push(function theFirst_fun_of_the_suit(){return 1 === 1});
    trivialCases.push(function second_fun_of_the_suit(){return "aaa" === "aaa"});
    trivialCases.push(function third_fun_of_the_suit(){return 99 === 99});
    trivialCases.push(function isArray_fun_of_the_suit(){return Array.isArray([3, 4, 5])});

    trivialCases.forEach(fun=>{
        it(`should execute trivial test case ${fun.name}`, done=>{
            fun().should.be.true;
            done();
        });
    });
});