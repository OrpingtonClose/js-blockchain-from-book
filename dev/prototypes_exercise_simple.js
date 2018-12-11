function User( firstName, lastName, age, gender) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.gender = gender;
}

User.prototype.emailDomain = "@facebook.com";
var user200 = new User("zenon", "elek", 23, "male");
var user1 = new User("ada", "poprawna", 23, "female");

User.prototype.getEmailAddress = function () {
    var capitalized_first_name = this.firstName.toUpperCase()[0] + this.firstName.toLowerCase().substr(1);
    var capitalized_last_name = this.lastName.toUpperCase()[0] + this.lastName.toLowerCase().substr(1)
    return capitalized_first_name + capitalized_last_name + this.emailDomain;
}

console.log(user200.getEmailAddress());
console.log(user1.getEmailAddress());