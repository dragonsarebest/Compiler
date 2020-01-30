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
            "CMA": "right",
            "ADDOP": "left",
            "MULOP": "left",
            "NEGATE": "right",
            "POWOP": "right",
            "FUNCCALL": "left"
        };
        this.operators = {
            "LP": 1,
            "CMA": 2,
            "ADDOP": 3,
            "NEGATE": 4,
            "POWOP": 5,
            "FUNCCALL": 6
        };
        //higher number means higher priority
        this.arity = {
            "LP": 2,
            "CMA": 2,
            "ADDOP": 2,
            "MULOP": 2,
            "NEGATE": 1,
            "POWOP": 2,
            "FUNCCALL": 2
        };
        console.log(input);
        let data = this.fs.readFileSync("myGrammar.txt", "utf8");
        let gg = new Grammar_1.Grammar(data);
        let tokenizer = new Tokenizer_1.Tokenizer(gg);
        tokenizer.setInput(input);
        this.operatorStack = Array();
        this.operandStack = Array();
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
                console.log("not a num or id or negate");
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
        while (this.operatorStack.length > 0) {
            this.doOperation();
        }
        console.log(this.operandStack[0]);
        this.operandStack[0].children.forEach(element => {
            console.log(element);
        });
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