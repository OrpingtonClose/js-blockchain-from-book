const chai = require("chai");
const expect = chai.expect;

chai.use(function (_chai, utils) {
    utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
        var obj = utils.flag(this, 'object');
        new chai.Assertion(obj).to.be.equal(str);
    });
    utils.addProperty(chai.Assertion.prototype, 'more', function (str) {
        var count = utils.flag(this, 'counter') || 0;
        count += 1
        utils.flag(this, 'counter', count);
        new chai.Assertion(count).to.not.be.equal(3);
    });
    utils.addProperty(chai.Assertion.prototype, 'permissive', function (str) {
        utils.flag(this, 'alter_a', true);
    });   
    utils.overwriteChainableMethod(chai.Assertion.prototype, 'a', function(_super) {
        var obj = utils.flag(this, "object");
        return function(str) {
            var orClause = utils.flag(this, "alter_a");
            //console.log(`<<<<<<<orClause ${utils.flag(this, "alter_a")}`);
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
    utils.overwriteChainableMethod(chai.Assertion.prototype, 'an', _super => function() {
        var orClause = utils.flag(this, "alter_a");
        if (orClause) {
            try {
                _super.apply(this, arguments);
            } 
            catch {
                utils.flag(this, "alter_a", false);
                console.log("catched");
            }
        } else {
            _super.apply(this, arguments);
        }
    }, _super => function() {
        _super.apply(this, arguments);
    });

/*
    utils.overwriteChainableMethod(chai.Assertion.prototype, 'ann', _super => () => {
        var orClause = utils.flag(this, "alter_a");
        console.log(`var orClause = ${orClause}`)
        if (orClause) {
            try {
                _super.apply(this, arguments);
            } 
            catch {
                utils.flag(this, "alter_a", false);
                console.log("catched");
            }
        } else {
            _super.apply(this, arguments);
        }
    }, _super => () => _super.apply(this, arguments));   
*/
});

describe("plugins", () =>{
    it("should pass with a tutorial method", done=>{
        expect("bar").to.be.foo('bar');
        done();
    });
    it.skip("should pass with a tutorial method", done => {
        expect("barr").to.be.foo('bar');
        done();
    });
    it.skip("should pass flag values", done => {
        expect("bar").more.more.more;
        done();
    });
    it("should pass flag values", done => {
        expect("bar").more.more;
        done();
    });
    it("should pass work correctly despite being overwritten", done => {
        expect([]).to.be.a("array");
        done();
    });
    it("should pass overwrite inbuilt methods", done => {
        expect([]).to.be.permissive.a("bouncy castle");
        done();
    });    
    it("should execute OR correctly", done => {
        expect([]).to.be.permissive.a("bouncy castle").and.not.a("bouncy castle");
        done();
    });
    it("should execute OR correctly - with arrow methods", done => {
        expect([]).to.be.permissive.an("bouncy castle").and.not.an("bouncy castle");
        done();
    });    
});