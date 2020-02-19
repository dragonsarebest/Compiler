"use strict";

declare var require: any;
let fs = require("fs");
import { makeNFA, makeDFA } from "./LR";

class NFAState {
    item: any;
    transitions: Map<string, number[]>;
}

class DFAState {
    label: any;
    transitions: Map<string, number>;
}


class Test {
    name: string;
    grammar: string;
}

function main() {

    let tests: Test[] = JSON.parse(fs.readFileSync("tests.txt", "utf8"));
    tests.forEach((t: Test) => {
        console.log(t.name);
        let nfa = makeNFA(t.grammar);
        let dfa = makeDFA(t.grammar);
        let dot = outputDotNFA(nfa);
        fs.writeFileSync(t.name + ".nfa.dot", dot);
        dot = outputDotDFA(dfa, nfa);
        fs.writeFileSync(t.name + ".dfa.dot", dot);
    });
}

function outputDotNFA(fa: NFAState[]) {
    let L: string[];
    L = [];
    L.push("digraph d{");
    L.push("node [fontname=Helvetica,shape=box];")
    L.push("edge [fontname=Helvetica];")

    fa.forEach((q: NFAState, i: number) => {
        let x = q.item.toString();
        x = x.replace(/&/g, "&amp;");
        x = x.replace(/</g, "&lt;");
        x = x.replace(/>/g, "&gt;");
        L.push("n" + i + " [label=<" + i + "<br />" + x + ">];");
    });
    fa.forEach((q: NFAState, i: number) => {
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


function outputDotDFA(dfa: DFAState[], nfa: NFAState[]) {
    let L: string[];
    L = [];
    L.push("digraph d{");
    L.push("node [fontname=Helvetica,shape=box];")
    L.push("edge [fontname=Helvetica];")

    dfa.forEach((q: DFAState, i: number) => {
        let s: string[] = [];
        q.label.forEach((nfaStateIndex: number) => {
            let nq = nfa[nfaStateIndex];
            let x = nq.item.toString();
            x += " [" + nfaStateIndex + "]";
            x = x.replace(/&/g, "&amp;");
            x = x.replace(/</g, "&lt;");
            x = x.replace(/>/g, "&gt;");
            s.push(x);
        });
        s.sort();
        L.push("n" + i + " [label=<" + i + "<br />" + s.join("<br />") + ">];");
    });

    dfa.forEach((q: DFAState, i: number) => {
        for (let sym of q.transitions.keys()) {
            let sym1: string;
            if (sym === "")
                sym1 = "<&lambda;>";
            else
                sym1 = "\"" + sym + "\"";

            let i2: number = q.transitions.get(sym);
            L.push("n" + i + " -> n" + i2 + " [label=" + sym1 + "];");
        }
    });
    L.push("}");
    return L.join("\n");
}



main()
