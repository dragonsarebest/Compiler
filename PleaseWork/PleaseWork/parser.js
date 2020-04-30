"use strict";
exports.__esModule = true;
var LR_1 = require("./LR");
var LR_2 = require("./LR");
var Tokenizer_1 = require("./Tokenizer");
var assembleTheAssembly_1 = require("./assembleTheAssembly");
var assembleTheAssembly_2 = require("./assembleTheAssembly");
var TreeNode = /** @class */ (function () {
    function TreeNode(sym, token) {
        this.sym = sym;
        this.token = token;
        this.children = [];
    }
    TreeNode.prototype.toString = function () {
        function walk(n, callback) {
            callback(n);
            n.children.forEach(function (x) {
                walk(x, callback);
            });
        }
        var L = [];
        L.push("digraph d{");
        L.push("node [fontname=\"Helvetica\",shape=box];");
        var counter = 0;
        walk(this, function (n) {
            n.NUMBER = "n" + (counter++);
            var tmp = n.sym;
            if (n.token) {
                tmp += "\n";
                tmp += n.token.lexeme;
            }
            tmp = tmp.replace(/&/g, "&amp;");
            tmp = tmp.replace(/</g, "&lt;");
            tmp = tmp.replace(/>/g, "&gt;");
            tmp = tmp.replace(/\n/g, "<br/>");
            L.push(n.NUMBER + " [label=<" + tmp + ">];");
        });
        walk(this, function (n) {
            n.children.forEach(function (x) {
                L.push(n.NUMBER + " -> " + x.NUMBER + ";");
            });
        });
        L.push("}");
        return L.join("\n");
    };
    return TreeNode;
}());
exports.TreeNode = TreeNode;
function parse(grammarString, programString) {
    var SLR_Table;
    var tokenizer;
    if (programString == undefined) {
        //means we have to supply our own grammar
        var fs = require("fs");
        programString = grammarString;
        grammarString = fs.readFileSync("./myGrammar.txt", 'utf8');
        //console.log("Program:\n", programString);
        //console.log(grammarString);
    }
    var results = LR_1.makeTable(grammarString);
    SLR_Table = results[0];
    tokenizer = new Tokenizer_1.Tokenizer(LR_2.gg);
    //console.log(programString);
    tokenizer.setInput(programString);
    return makeTree(SLR_Table, tokenizer);
}
exports.parse = parse;
function makeTree(SLR_Table, tokenizer) {
    var stateStack;
    //SLR_Table.forEach((value: Map<string, any>, idx: number) => {
    //    console.log("[" + idx + "] ", value);
    //});
    exports.nodeStack = []; //starts off empty
    stateStack = [0]; //0 = initial state
    while (true) {
        var s = stateStack[stateStack.length - 1];
        var t = tokenizer.peek().sym;
        //console.log("current symbol: ", t);
        //console.log("\nnumber, slr_table[s]");
        //console.log(s, SLR_Table[s]);
        if (!SLR_Table[s].has(t)) {
            var errorMsg = "Syntax error, table doesn't contain a rule for shift/reduce on: " + t + " for state: " + s + "::";
            console.log("\nError: " + errorMsg);
            //console.log(SLR_Table[s]);
            //let L = dfa[s];
            //L.label.forEach((nfaStateNum: number) => {
            //    console.log(nfa[nfaStateNum]);
            //});
            throw new Error(errorMsg);
        }
        var a = SLR_Table[s].get(t);
        if (a.action == "s") {
            stateStack.push(a.num);
            var tempToken = tokenizer.next();
            var newNode = new TreeNode(tempToken.sym, tempToken);
            exports.nodeStack.push(newNode);
            //? jimbo used tokenizer.get() which isnt a function...
        }
        else if (a.action == "r") {
            if (a.lhs == "S'") {
                //accept input???
                break;
            }
            else {
                var newNode = new TreeNode(undefined, undefined);
                newNode.sym = a.lhs;
                for (var i = 0; i < a.num; i++) {
                    stateStack.pop();
                    var newChild = exports.nodeStack.pop();
                    var tempStack = [newChild];
                    newNode.children = tempStack.concat(newNode.children);
                }
                s = stateStack[stateStack.length - 1];
                var a2 = SLR_Table[s].get(a.lhs);
                stateStack.push(a2.num);
                exports.nodeStack.push(newNode);
            }
        }
        else {
            console.log("\nError: Found an action that is neither a shift nor a reduce!" + a);
            throw new Error("Error: Found an action that is neither a shift nor a reduce!" + a);
        }
    }
    assembleTheAssembly_1.makeAsm(exports.nodeStack[0]);
    return assembleTheAssembly_2.asmCode.join("\n");
}
//# sourceMappingURL=parser.js.map