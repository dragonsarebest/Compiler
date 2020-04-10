"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LR_1 = require("./LR");
const LR_2 = require("./LR");
const Tokenizer_1 = require("./Tokenizer");
class TreeNode {
    constructor(sym, token) {
        this.sym = sym;
        this.token = token;
        this.children = [];
    }
    toString() {
        function walk(n, callback) {
            callback(n);
            n.children.forEach((x) => {
                walk(x, callback);
            });
        }
        let L = [];
        L.push("digraph d{");
        L.push(`node [fontname="Helvetica",shape=box];`);
        let counter = 0;
        walk(this, (n) => {
            n.NUMBER = "n" + (counter++);
            let tmp = n.sym;
            if (n.token) {
                tmp += "\n";
                tmp += n.token.lexeme;
            }
            tmp = tmp.replace(/&/g, "&amp;");
            tmp = tmp.replace(/</g, "&lt;");
            tmp = tmp.replace(/>/g, "&gt;");
            tmp = tmp.replace(/\n/g, "<br/>");
            L.push(`${n.NUMBER} [label=<${tmp}>];`);
        });
        walk(this, (n) => {
            n.children.forEach((x) => {
                L.push(`${n.NUMBER} -> ${x.NUMBER};`);
            });
        });
        L.push("}");
        return L.join("\n");
    }
}
exports.TreeNode = TreeNode;
function parse(grammarString, programString) {
    let SLR_Table;
    let tokenizer;
    if (programString == undefined) {
        //means we have to supply our own grammar
        let fs = require("fs");
        programString = grammarString;
        grammarString = fs.readFileSync("./myGrammar.txt", 'utf8');
        //console.log(grammarString);
    }
    let results = LR_1.makeTable(grammarString);
    SLR_Table = results[0];
    tokenizer = new Tokenizer_1.Tokenizer(LR_2.gg);
    tokenizer.setInput(programString);
    return makeTree(SLR_Table, tokenizer);
}
exports.parse = parse;
function makeTree(SLR_Table, tokenizer) {
    let stateStack;
    exports.nodeStack = []; //starts off empty
    stateStack = [0]; //0 = initial state
    while (true) {
        let s = stateStack[stateStack.length - 1];
        let t = tokenizer.peek().sym;
        //console.log("current symbol: ", t);
        //console.log("\nnumber, slr_table[s]");
        //console.log(s, SLR_Table[s]);
        if (!SLR_Table[s].has(t)) {
            let errorMsg = "Syntax error, table doesn't contain a rule for shift/reduce on: " + t + " for state: " + s + "::";
            console.log("\tError: " + errorMsg);
            console.log(SLR_Table[s]);
            throw new Error(errorMsg);
        }
        let a = SLR_Table[s].get(t);
        if (a.action == "s") {
            stateStack.push(a.num);
            let tempToken = tokenizer.next();
            let newNode = new TreeNode(tempToken.sym, tempToken);
            exports.nodeStack.push(newNode);
            //? jimbo used tokenizer.get() which isnt a function...
        }
        else if (a.action == "r") {
            if (a.lhs == "S'") {
                //accept input???
                break;
            }
            else {
                let newNode = new TreeNode(undefined, undefined);
                newNode.sym = a.lhs;
                for (let i = 0; i < a.num; i++) {
                    stateStack.pop();
                    let newChild = exports.nodeStack.pop();
                    let tempStack = [newChild];
                    newNode.children = tempStack.concat(newNode.children);
                }
                s = stateStack[stateStack.length - 1];
                let a2 = SLR_Table[s].get(a.lhs);
                stateStack.push(a2.num);
                exports.nodeStack.push(newNode);
            }
        }
        else {
            console.log("\tError: Found an action that is neither a shift nor a reduce!" + a);
            throw new Error("Error: Found an action that is neither a shift nor a reduce!" + a);
        }
    }
    return exports.nodeStack[0].toString();
}
//# sourceMappingURL=parser.js.map