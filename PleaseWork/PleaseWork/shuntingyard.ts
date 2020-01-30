import { Token } from "./Token"
import { Tokenizer } from "./Tokenizer"
import { Grammar } from "./Grammar"


class TreeNode {
    sym: string;
    token: Token;
    children: TreeNode[];
    constructor(sym: string, token: Token) {
        this.sym = sym;
        this.token = token;
        this.children = [];
    }

    addChild(baby: TreeNode) {
        this.children.push(baby);
    }
}


export class parse {
    operatorStack: Array<TreeNode>;
    operandStack: Array<TreeNode>;
    fs = require("fs");

    associativity =
        {
            "LP": "left",
            "COMMA": "right",
            "ADDOP": "left",
            "MULOP": "left",
            "MODULO": "left",
            "NEGATE": "right",
            "POWOP": "right",
            "FUNCCALL": "left"
        }

    operators =
        {
            "LP": 1,
            "COMMA": 2,
            "ADDOP": 3,
            "MULOP": 4,
            "MODULO": 5,
            "NEGATE": 6,
            "POWOP": 7,
            "FUNCCALL": 8
        }
    //higher number means higher priority

    arity =
        {
            "LP": 1,
            "COMMA": 1,
            "ADDOP": 1,
            "MULOP": 1,
            "MODULO": 1,
            "NEGATE": 2,
            "POWOP": 1,
            "FUNCCALL": 1
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

    constructor(input: string) {

        console.log(input);

        let data: string = this.fs.readFileSync("myGrammar.txt", "utf8");
        let gg = new Grammar(data);
        let tokenizer = new Tokenizer(gg);
        tokenizer.setInput(input);

        do {
            let t = tokenizer.next();
            let pt = new Token("nothing", "nothing", -1);
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



}

