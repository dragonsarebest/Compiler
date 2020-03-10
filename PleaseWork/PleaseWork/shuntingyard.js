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
    //console.log("Opperation node: " + opNode.sym);
    let c1 = operandStack.pop();
    if (arity.get(opNode.sym) == 2) {
        let c2 = operandStack.pop();
        opNode.addChild(c2);
        //console.log("Adding to opperation's children: " + c2.sym);
    }
    opNode.addChild(c1);
    //console.log("Adding to opperation's children: " + c1.sym);
    operandStack.push(opNode);
}
function createNewNode(t, gg) {
    let tNode = new TreeNode(t.sym, t);
    let rhs = [];
    gg.nonterminals.forEach(element => {
        if (element.sym == t.sym) {
            rhs.push(element.eq);
        }
    });
    tNode.rhs = rhs;
    return tNode;
}
function parse(input) {
    let operatorStack;
    let operandStack;
    let fs = require("fs");
    let associativity = new Map();
    associativity.set("LP", "left");
    associativity.set("CMA", "right");
    associativity.set("MULOP", "left");
    associativity.set("ADDOP", "left");
    associativity.set("NEGATE", "right");
    associativity.set("BITNOT", "right");
    associativity.set("POWOP", "right");
    associativity.set("FUNCCALL", "left");
    let operators = new Map();
    operators.set("LP", 1);
    operators.set("CMA", 2);
    operators.set("ADDOP", 3);
    operators.set("MULOP", 4);
    operators.set("BITNOT", 5);
    operators.set("NEGATE", 6);
    operators.set("POWOP", 7);
    operators.set("FUNCCALL", 8);
    //higher number means higher priority
    let arity = new Map();
    arity.set("LP", 2);
    arity.set("CMA", 2);
    arity.set("ADDOP", 2);
    arity.set("MULOP", 2);
    arity.set("NEGATE", 1);
    arity.set("POWOP", 2);
    arity.set("FUNCCALL", 2);
    arity.set("BITNOT", 1);
    //all unary opperations become 1 in arity
    //console.log("INPUT:");
    //console.log(input);
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
        //console.log("Token: " + t);
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
            let tNode = createNewNode(t, gg);
            operatorStack.push(tNode);
            continue;
        }
        //THIS DOESN'T WORK AS INTENDED???
        if (sym == "NUM" || sym == "ID") {
            let tNode = createNewNode(t, gg);
            operatorStack.push(tNode);
        }
        else {
            //console.log("not a num or id or negate");
            if (associativity.get(sym) == "left") {
                while (true) {
                    if (operatorStack.length == 0)
                        break;
                    let A = operatorStack[operatorStack.length - 1].sym;
                    if (operators.get(A) < operators.get(sym)) {
                        break;
                    }
                    doOperation(operatorStack, operandStack, arity);
                }
                let tNode = createNewNode(t, gg);
                operatorStack.push(tNode);
            }
            else {
                while (true) {
                    if (operatorStack.length == 0)
                        break;
                    let A = operatorStack[operatorStack.length - 1].sym;
                    if (operators.get(A) >= operators.get(sym)) {
                        doOperation(operatorStack, operandStack, arity);
                    }
                    else {
                        break;
                    }
                    doOperation(operatorStack, operandStack, arity);
                }
                let tNode = createNewNode(t, gg);
                operatorStack.push(tNode);
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