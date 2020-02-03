"use strict";

//This test harness doesn't output many diagnostics when things break.
//If you want to, you can instrument it accordingly to help you debug.

declare var require: any;

import { Tokenizer } from "./Tokenizer"
import { Grammar } from "./Grammar"
let fs = require("fs");


function main() {
    let teststr: string = fs.readFileSync("tests.txt", "utf8");
    let tests = JSON.parse(teststr);
    let lastSpec: string;
    let G: Grammar;
    let T: Tokenizer;

    for (let i = 0; i < tests.length; ++i) {
        console.log("Test " + i);
        let spec = tests[i]["tokenSpec"];
        let inp = tests[i]["input"];
        let expected = tests[i]["expected"];
        if (spec !== lastSpec) {
            G = new Grammar(spec);
            T = new Tokenizer(G);
            console.log("Creating tokenizer for " + tests[i]["gname"] + "...");
            lastSpec = spec;
        } else {
            console.log("Reusing tokenizer...");
        }

        console.log("Input " + tests[i]["iname"]);
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

            } catch (e) {

                if (e) {
                    if (expectedToken === undefined) {
                        //failure was expected
                        break;
                    } else {
                        throw (e);
                    }
                }
            }

        }
    }
    console.log(tests.length + " tests OK");
}

main()
