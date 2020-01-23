"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Grammar_1 = require("./Grammar");
let fs = require("fs");
function main() {
    let teststr = fs.readFileSync("tests.txt", "utf8");
    let tests = JSON.parse(teststr);
    let G;
    for (let i = 0; i < tests.length; ++i) {
        console.log("Test " + i);
        let spec = tests[i]["spec"];
        let valid = tests[i]["valid"];
        let name = tests[i]["name"];
        try {
            let G = new Grammar_1.Grammar(spec);
            if (valid) {
            }
            else {
                console.log("Reported grammar " + name + " as valid, but it's not.");
                return;
            }
        }
        catch (e) {
            if (valid) {
                console.log("Reported grammar " + name + " as invalid, but it's valid.");
                console.log(e);
                return;
            }
            else {
            }
        }
    }
    console.log(tests.length + " tests OK");
}
main();
//# sourceMappingURL=testharness.js.map