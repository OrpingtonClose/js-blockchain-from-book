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
    fs.writeFileSync(`${filePrefix}${key}`, value);
}

db.prototype.get = function(key) {
    try {
        let result = fs.readFileSync(`${filePrefix}${key}`);
        return result;
    }
    catch {
        //nothing
    }
    
    const files = fs.readdirSync(".");
    for (let n; n < files.length; n += 1) {
        if (files[n].startsWith(`${filePrefix}${key}`)) {
            return files[n];
        }
    }
    return "";
}
db.prototype.del = function(key) {
    fs.unlinkSync(key);
}

module.exports = db;