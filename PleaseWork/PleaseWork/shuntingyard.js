"use strict";
exports.__esModule = true;
var Token_1 = require("./Token");
var Tokenizer_1 = require("./Tokenizer");
var Grammar_1 = require("./Grammar");
var TreeNode = /** @class */ (function () {
    function TreeNode(sym, token) {
        this.sym = sym;
        this.token = token;
        this.children = [];
    }
    TreeNode.prototype.addChild = function (baby) {
        this.children.push(baby);
    };
    return TreeNode;
}());
function doOperation(operatorStack, operandStack, arity) {
    var opNode = operatorStack.pop();
    //console.log("Opperation node: " + opNode.sym);
    var c1 = operandStack.pop();
    if (arity.get(opNode.sym) == 2) {
        var c2 = operandStack.pop();
        opNode.addChild(c2);
        //console.log("Adding to opperation's children: " + c2.sym);
    }
    opNode.addChild(c1);
    //console.log("Adding to opperation's children: " + c1.sym);
    operandStack.push(opNode);
}
function createNewNode(t, gg) {
    var tNode = new TreeNode(t.sym, t);
    var rhs = [];
    gg.nonterminals.forEach(function (element) {
        if (element.sym == t.sym) {
            rhs.push(element.eq);
        }
    });
    tNode.rhs = rhs;
    return tNode;
}
function parse(input) {
    var operatorStack;
    var operandStack;
    var fs = require("fs");
    var associativity = new Map();
    associativity.set("LP", "left");
    associativity.set("CMA", "right");
    associativity.set("MULOP", "left");
    associativity.set("ADDOP", "left");
    associativity.set("NEGATE", "right");
    associativity.set("BITNOT", "right");
    associativity.set("POWOP", "right");
    associativity.set("FUNCCALL", "left");
    var operators = new Map();
    operators.set("LP", 1);
    operators.set("CMA", 2);
    operators.set("ADDOP", 3);
    operators.set("MULOP", 4);
    operators.set("BITNOT", 5);
    operators.set("NEGATE", 6);
    operators.set("POWOP", 7);
    operators.set("FUNCCALL", 8);
    //higher number means higher priority
    var arity = new Map();
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
    var data = fs.readFileSync("myGrammar.txt", "utf8");
    var gg = new Grammar_1.Grammar(data);
    var tokenizer = new Tokenizer_1.Tokenizer(gg);
    tokenizer.setInput(input);
    operatorStack = Array();
    operandStack = Array();
    do {
        var t = tokenizer.next();
        var pt = new Token_1.Token("nothing", "nothing", -1);
        if (t.sym == "$")
            break;
        if (t.lexeme == "-") {
            pt = tokenizer.previous;
        }
        if (pt == undefined || pt.sym == "LPAREN" || pt.sym in operators) {
            t.sym = "NEGATE";
        }
        var sym = t.sym;
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
            var tNode = createNewNode(t, gg);
            operatorStack.push(tNode);
            continue;
        }
        //THIS DOESN'T WORK AS INTENDED???
        if (sym == "NUM" || sym == "ID") {
            var tNode = createNewNode(t, gg);
            operatorStack.push(tNode);
        }
        else {
            //console.log("not a num or id or negate");
            if (associativity.get(sym) == "left") {
                while (true) {
                    if (operatorStack.length == 0)
                        break;
                    var A = operatorStack[operatorStack.length - 1].sym;
                    if (operators.get(A) < operators.get(sym)) {
                        break;
                    }
                    doOperation(operatorStack, operandStack, arity);
                }
                var tNode = createNewNode(t, gg);
                operatorStack.push(tNode);
            }
            else {
                while (true) {
                    if (operatorStack.length == 0)
                        break;
                    var A = operatorStack[operatorStack.length - 1].sym;
                    if (operators.get(A) >= operators.get(sym)) {
                        doOperation(operatorStack, operandStack, arity);
                    }
                    else {
                        break;
                    }
                    doOperation(operatorStack, operandStack, arity);
                }
                var tNode = createNewNode(t, gg);
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
    var output = operandStack[0];
    //console.log("OUTPUT:" + (output instanceof TreeNode));
    //console.log(output);
    //operandStack[0].children.forEach(element => {
    //    console.log(element);
    //});
    return output;
}
exports.parse = parse;
//# sourceMappingURL=shuntingyard.js.map