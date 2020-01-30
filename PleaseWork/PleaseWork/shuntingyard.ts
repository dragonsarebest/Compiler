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
            "CMA": "right",
            "ADDOP": "left",
            "MULOP": "left",
            "NEGATE": "right",
            "POWOP": "right",
            "FUNCCALL": "left"
        }

    operators =
        {
            "LP": 1,
            "CMA": 2,
            "ADDOP": 3,
            "NEGATE": 4,
            "POWOP": 5,
            "FUNCCALL": 6
        }
    //higher number means higher priority

    arity =
        {
            "LP": 2,
            "CMA": 2,
            "ADDOP": 2,
            "MULOP": 2,
            "NEGATE": 1,
            "POWOP": 2,
            "FUNCCALL": 2
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

        this.operatorStack = Array<TreeNode>();
        this.operandStack = Array<TreeNode>();

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



}

