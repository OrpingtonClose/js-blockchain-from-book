const {Given, When, Then, setWorldConstructor} = require('cucumber');
const {expect} = require("chai");

class CustomWorld {
    constructor() {
        this.variable = 0;
    }
    addZeroToNumber() {
        console.log("adding zero!")
        this.variable += 0;
    }
}
setWorldConstructor(CustomWorld);

Given("I start with {int}", function(number){
    this.variable = number;
});
When("I add {int}", function(number){
    this.thisOtherNumber = number;
    this.result = this.thisOtherNumber + this.variable;
    this.addZeroToNumber();
});
Then("I end up with {int}", function(number){
    expect(number).to.be.equal(this.result);
});