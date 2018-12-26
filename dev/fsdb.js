const fs = require("fs");
const filePrefix = "____";

function db(createNew) {
    if (createNew) {
        const files = fs.readdirSync(".");
        for (let n = 0; n < files.length; n += 1) {
            if (files[n].startsWith(`${filePrefix}`)) {
                fs.unlinkSync(files[n]);
            }
        }
    }
}

db.prototype.put = function(key, value) {
    fs.writeFileSync(`${filePrefix}${key}`, JSON.stringify(value));
}

db.prototype.get = function(key) {
    let result = "{}";
    try {
        result = fs.readFileSync(`${filePrefix}${key}`).toString();
    }
    catch {
        //nothing
    }
    if (!result) {
        const files = fs.readdirSync(".");
        for (let n = 0; n < files.length; n += 1) {
            if (files[n].startsWith(`${filePrefix}${key}`)) {
                result = fs.readFileSync(files[n]).toString();
            }
        }
    }
    return JSON.parse(result);
}
db.prototype.del = function(key) {
    fs.unlinkSync(key);
}

module.exports = db;