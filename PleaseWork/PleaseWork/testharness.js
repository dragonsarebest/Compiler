"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let fs = require("fs");
const Grammar_1 = require("./Grammar");
//i have made a chang
function main() {
    let data = fs.readFileSync("tests.txt", "utf8");
    let tests = JSON.parse(data);
    for (let i = 0; i < tests.length; ++i) {
        let name = tests[i]["name"];
        let ok = tests[i]["ok"];
        let grammar = tests[i]["grammar"];
        let accepted = false;
        try {
            let G = new Grammar_1.Grammar(grammar);
            accepted = true;
        }
        catch (e) {
        }
        if (ok) {
            if (!accepted) {
                console.log("Rejected valid grammar " + name);
                return;
            }
        }
        else {
            if (accepted) {
                console.log("Accepted invalid grammar " + name);
                return;
            }
        }
    }
    console.log("All tests OK");
    return true;
}
main();
//# sourceMappingURL=testharness.js.map