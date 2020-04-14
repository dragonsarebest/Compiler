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


//class Test {
//    name: string;
//    grammar: string;
//}

function main() {

    let tests = [];
	tests.push(["dfaV1-1", "IF -> \bif\b\nELSE -> \belse\b\nADDOP -> [-+]\nSTARSTAR -> [*][*]\nMULOP -> [* /%]\nNUM -> -?\d +\nID -> [A - Za - z_]\w *\nLP -> [(]\nRP -> [)]\nEQ -> =\nSEMI -> ; \nCMA -> , \n\nS -> stmt S | stmt\nstmt -> assign SEMI | func SEMI | cond\nassign -> ID EQ sum\nfunc -> ID LP plist RP\nplist -> lambda | sum | sum CMA plist'\nplist' -> sum | sum CMA plist'\nsum -> sum ADDOP prod | prod\nprod -> prod MULOP pow | pow\npow -> factor STARSTAR pow | factor\nfactor -> ID | NUM | LP sum RP\ncond -> IF LP sum RP stmt | IF LP sum RP stmt ELSE stmt\n"]);
    tests.forEach((t: string[]) => {
		let name: string = t[0];
		let grammar: string = t[1];
        console.log(name);
        let nfa = makeNFA(grammar);
        let dfa = makeDFA(grammar);
        let dot = outputDotNFA(nfa);
        fs.writeFileSync(name + ".nfa.dot", dot);
        dot = outputDotDFA(dfa, nfa);
        fs.writeFileSync(name + ".dfa.dot", dot);
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
