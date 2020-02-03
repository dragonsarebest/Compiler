"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("./Token");
const Tokenizer_1 = require("./Tokenizer");
const Grammar_1 = require("./Grammar");
class TreeNode {
    constructor(sym, token) {
        this.sym = sym;
        this.token = token;
        this.children = [];
    }
    addChild(baby) {
        this.children.push(baby);
    }
}
class parse {
    constructor(input) {
        this.fs = require("fs");
        this.associativity = {
            "LP": "left",
            "COMMA": "right",
            "ADDOP": "left",
            "MULOP": "left",
            "MODULO": "left",
            "NEGATE": "right",
            "POWOP": "right",
            "FUNCCALL": "left"
        };
        this.operators = {
            "LP": 1,
            "COMMA": 2,
            "ADDOP": 3,
            "MULOP": 4,
            "MODULO": 5,
            "NEGATE": 6,
            "POWOP": 7,
            "FUNCCALL": 8
        };
        //higher number means higher priority
        this.arity = {
            "LP": 1,
            "COMMA": 1,
            "ADDOP": 1,
            "MULOP": 1,
            "MODULO": 1,
            "NEGATE": 2,
            "POWOP": 1,
            "FUNCCALL": 1
        };
        console.log(input);
        let data = this.fs.readFileSync("myGrammar.txt", "utf8");
        let gg = new Grammar_1.Grammar(data);
        let tokenizer = new Tokenizer_1.Tokenizer(gg);
        tokenizer.setInput(input);
        do {
            let t = tokenizer.next();
            let pt = new Token_1.Token("nothing", "nothing", -1);
            if (t.sym == "$")
                break;
            if (t.lexeme == "-") {
                pt = tokenizer.previous();
            }
            if (pt.sym != "nothing" && (pt == undefined || pt.sym == "LPAREN" || pt.sym in this.operators)) {
                t.sym = "NEGATE";
            }
            let sym = t.sym;
            if (sym == "NUM" || sym == "ID") {
                this.operandStack.push(new TreeNode(t.sym, t));
            }
            else {
                if (this.associativity[sym] == "left") {
                    while (true) {
                        if (this.operatorStack.length == 0)
                            break;
                        let A = this.operatorStack[this.operatorStack.length - 1].sym;
                        if (this.operators[A] < this.operators[sym]) {
                            break;
                        }
                        this.doOperation();
                    }
                    this.operatorStack.push(new TreeNode(t.sym, t));
                }
                else {
                    while (true) {
                        if (this.operatorStack.length == 0)
                            break;
                        let A = this.operatorStack[this.operatorStack.length - 1].sym;
                        if (this.operators[A] >= this.operators[sym]) {
                            this.doOperation();
                        }
                        else {
                            break;
                        }
                        this.doOperation();
                    }
                    this.operatorStack.push(new TreeNode(t.sym, t));
                    while (this.operatorStack.length > 0) {
                        this.doOperation();
                    }
                }
            }
        } while (true);
    }
    //all unary opperations become 2 in arity
    doOperation() {
        let opNode = this.operatorStack.pop();
        let c1 = this.operandStack.pop();
        if (this.arity[opNode.sym] == 2) {
            let c2 = this.operandStack.pop();
            opNode.addChild(c2);
        }
        opNode.addChild(c1);
        this.operandStack.push(opNode);
    }
}
exports.parse = parse;
//# sourceMappingURL=shuntingyard.js.map