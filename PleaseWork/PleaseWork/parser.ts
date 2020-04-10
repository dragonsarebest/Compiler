import { makeTable } from "./LR"
import { Action } from "./LR"
import { gg } from "./LR"
import { nfa } from "./LR"
import { dfa } from "./LR"
import { Tokenizer } from "./Tokenizer"
import { Token } from "./Token"

export class TreeNode {
    sym: string;    //token's sym or production's lhs
    token: Token;   //might be <undefined>
    rhs: string[];   //rhs of production; might be <undefined>
    children: TreeNode[];
    constructor(sym: string, token: Token) {
        this.sym = sym;
        this.token = token;
        this.children = [];
    }
    toString() {
        function walk(n: any, callback: any) {
            callback(n);
            n.children.forEach((x: any) => {
                walk(x, callback);
            });
        }
        let L: string[] = [];
        L.push("digraph d{");
        L.push(`node [fontname="Helvetica",shape=box];`);
        let counter = 0;
        walk(this, (n: any) => {
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
        walk(this, (n: any) => {
            n.children.forEach((x: any) => {
                L.push(`${n.NUMBER} -> ${x.NUMBER};`);
            });
        });
        L.push("}");
        return L.join("\n");
    }
}


export let nodeStack: TreeNode[];

export function parse(grammarString: string, programString?: string) {
    let SLR_Table: Map<string, any>[];
    let tokenizer: Tokenizer;

    if (programString == undefined) {
        //means we have to supply our own grammar
        let fs = require("fs");
        programString = grammarString;
        grammarString = fs.readFileSync("./myGrammar.txt", 'utf8');

        //console.log(grammarString);
    }


    let results = makeTable(grammarString);

    SLR_Table = results[0];
    tokenizer = new Tokenizer(gg);
    tokenizer.setInput(programString);


    return makeTree(SLR_Table, tokenizer);
}

function makeTree(SLR_Table: Map < string, any > [], tokenizer: Tokenizer): string {
    let stateStack: number[];

    SLR_Table.forEach((value: Map<string, any>, idx: number) => {
        console.log("[" + idx + "] ", value);
    });

    nodeStack = [];        //starts off empty
    stateStack = [0];        //0 = initial state
    while (true) {
        let s: number = stateStack[stateStack.length - 1];
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
        let a: Action = SLR_Table[s].get(t);
        if (a.action == "s") {
            stateStack.push(a.num);
            let tempToken = tokenizer.next();
            let newNode = new TreeNode(tempToken.sym, tempToken);
            nodeStack.push(newNode);
            //? jimbo used tokenizer.get() which isnt a function...
        }
        else if (a.action == "r") {
            if (a.lhs == "S'") {
                //accept input???
                break;
            } else {
                let newNode = new TreeNode(undefined, undefined);
                newNode.sym = a.lhs;
                for (let i = 0; i < a.num; i++) {
                    stateStack.pop();
                    let newChild: TreeNode = nodeStack.pop();
                    let tempStack = [newChild];
                    newNode.children = tempStack.concat(newNode.children);
                }
                s = stateStack[stateStack.length - 1];
                let a2: Action = SLR_Table[s].get(a.lhs);
                stateStack.push(a2.num);
                nodeStack.push(newNode);
            }
        }
        else {
            console.log("\tError: Found an action that is neither a shift nor a reduce!" + a);
            throw new Error("Error: Found an action that is neither a shift nor a reduce!" + a);
        }
    }

    return nodeStack[0].toString();
}