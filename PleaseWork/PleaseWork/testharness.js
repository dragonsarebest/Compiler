"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Tokenizer_1 = require("./Tokenizer");
const Grammar_1 = require("./Grammar");
let fs = require("fs");
function main() {
    let teststr = fs.readFileSync("testcases.txt", "utf8");
    let tests = JSON.parse(teststr);
    let lastSpec;
    let G;
    let T;
    for (let i = 0; i < tests.length; ++i) {
        console.log("Test " + i);
        let spec = tests[i]["tokenSpec"];
        let inp = tests[i]["input"];
        let expected = tests[i]["expected"];
        if (spec !== lastSpec) {
            G = new Grammar_1.Grammar(spec);
            T = new Tokenizer_1.Tokenizer(G);
            console.log("Creating tokenizer...");
            lastSpec = spec;
        }
        else {
            console.log("Reusing tokenizer...");
        }
        T.setInput(inp);
        let j = 0;
        while (true) {
            let expectedToken = expected[j++];
            try {
                let tok = T.next();
                if (expectedToken === undefined) {
                    console.log("Did not expect to get token here");
                    return;
                }
                if (expectedToken.sym === "$" && tok.sym === "$") {
                    break;
                }
                if (tok.sym !== expectedToken.sym || tok.lexeme !== expectedToken.lexeme || tok.line !== expectedToken.line) {
                    console.log("Mismatch");
                    console.log("\tGot:", tok);
                    console.log("\tExpected:", expectedToken);
                    console.log("\tGrammar:");
                    console.log("" + spec);
                    return;
                }
            }
            catch (e) {
                if (e) {
                    if (expectedToken === undefined) {
                        //failure was expected
                        break;
                    }
                    else {
                        throw (e);
                    }
                }
            }
        }
    }
    console.log(tests.length + " tests OK");
}
main();
//# sourceMappingURL=testharness.js.map