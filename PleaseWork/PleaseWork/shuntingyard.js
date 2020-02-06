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
function doOperation(operatorStack, operandStack, arity) {
    let opNode = operatorStack.pop();
    console.log("Opperation node: " + opNode.sym);
    let c1 = operandStack.pop();
    if (arity[opNode.sym] == 2) {
        let c2 = operandStack.pop();
        opNode.addChild(c2);
        console.log("Adding to opperation's children: " + c2.sym);
    }
    opNode.addChild(c1);
    console.log("Adding to opperation's children: " + c1.sym);
    operandStack.push(opNode);
}
function parse(input) {
    let operatorStack;
    let operandStack;
    let fs = require("fs");
    let associativity = {
        "LP": "left",
        "CMA": "right",
        "MULOP": "left",
        "ADDOP": "left",
        "NEGATE": "right",
        "BITNOT": "right",
        "POWOP": "right",
        "FUNCCALL": "left"
    };
    let operators = {
        "LP": 1,
        "CMA": 2,
        "ADDOP": 3,
        "MULOP": 4,
        "NEGATE": 5,
        "BITNOT": 5,
        "POWOP": 6,
        "FUNCCALL": 7
    };
    //higher number means higher priority
    let arity = {
        "LP": 2,
        "CMA": 2,
        "ADDOP": 2,
        "MULOP": 2,
        "NEGATE": 1,
        "POWOP": 2,
        "FUNCCALL": 2,
        "BITNOT": 1
    };
    //all unary opperations become 1 in arity
    console.log("INPUT:");
    console.log(input);
    let data = fs.readFileSync("myGrammar.txt", "utf8");
    let gg = new Grammar_1.Grammar(data);
    let tokenizer = new Tokenizer_1.Tokenizer(gg);
    tokenizer.setInput(input);
    operatorStack = Array();
    operandStack = Array();
    do {
        let t = tokenizer.next();
        let pt = new Token_1.Token("nothing", "nothing", -1);
        if (t.sym == "$")
            break;
        if (t.lexeme == "-") {
            pt = tokenizer.previous;
        }
        if (pt == undefined || pt.sym == "LPAREN" || pt.sym in operators) {
            t.sym = "NEGATE";
        }
        let sym = t.sym;
        console.log("Token: " + t);
        if (sym == "RP") {
            while (true) {
                if (operatorStack[operatorStack.length - 1].sym == "LP") {
                    operatorStack.pop();
                    break;
                }
                doOperation(operatorStack, operandStack, arity);
            }
            continue;
        }
        if (sym == "LP" || sym == "POWOP" || sym == "BITNOT" || sym == "NEGATE") {
            operatorStack.push(new TreeNode(t.sym, t));
            continue;
        }
        //THIS DOESN'T WORK AS INTENDED???
        if (sym == "NUM" || sym == "ID") {
            operandStack.push(new TreeNode(t.sym, t));
        }
        else {
            console.log("not a num or id or negate");
            if (associativity[sym] == "left") {
                while (true) {
                    if (operatorStack.length == 0)
                        break;
                    let A = operatorStack[operatorStack.length - 1].sym;
                    if (operators[A] < operators[sym]) {
                        break;
                    }
                    doOperation(operatorStack, operandStack, arity);
                }
                operatorStack.push(new TreeNode(t.sym, t));
            }
            else {
                while (true) {
                    if (operatorStack.length == 0)
                        break;
                    let A = operatorStack[operatorStack.length - 1].sym;
                    if (operators[A] >= operators[sym]) {
                        doOperation(operatorStack, operandStack, arity);
                    }
                    else {
                        break;
                    }
                    doOperation(operatorStack, operandStack, arity);
                }
                operatorStack.push(new TreeNode(t.sym, t));
                while (operatorStack.length > 0) {
                    doOperation(operatorStack, operandStack, arity);
                }
            }
        }
    } while (true);
    while (operatorStack.length > 0) {
        doOperation(operatorStack, operandStack, arity);
    }
    let output = operandStack[0];
    //console.log("OUTPUT:" + (output instanceof TreeNode));
    //console.log(output);
    //operandStack[0].children.forEach(element => {
    //    console.log(element);
    //});
    return output;
}
exports.parse = parse;
//# sourceMappingURL=shuntingyard.js.map