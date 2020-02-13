"use strict";

declare var require: any;
let fs = require("fs");
import { makeNFA } from "./LR";

class State {
    item: any;
    transitions: Map<string, number[]>;
}

class Test {
    name: string;
    grammar: string;
}

function main() {

    let tests: Test[] = JSON.parse(fs.readFileSync("tests.txt", "utf8"));
    tests.forEach((t: Test) => {
        console.log(t.name);
        let nfa: State[] = makeNFA(t.grammar);
        let dot = outputDot(nfa);
        fs.writeFileSync(t.name + ".dot", dot);
    });
}

function outputDot(fa: State[]) {
    let L: string[];
    L = [];
    L.push("digraph d{");
    L.push("node [fontname=Helvetica,shape=box];")
    L.push("edge [fontname=Helvetica];")

    fa.forEach((q: State, i: number) => {
        let x = q.item.toString();
        x = x.replace(/&/g, "&amp;");
        x = x.replace(/</g, "&lt;");
        x = x.replace(/>/g, "&gt;");
        L.push("n" + i + " [label=<" + i + "<br />" + x + ">];");
    });
    fa.forEach((q: State, i: number) => {
        for (let sym of q.transitions.keys()) {
            let sym1: string;
            if (sym === "")
                sym1 = "<&lambda;>";
            else
                sym1 = "\"" + sym + "\"";

            let L2: number[] = q.transitions.get(sym);
            L2.forEach((i2: number) => {
                L.push("n" + i + " -> n" + i2 + " [label=" + sym1 + "];");
            });
        }
    });
    L.push("}");
    return L.join("\n");
}

main()
