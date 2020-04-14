"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
exports.__esModule = true;
var fs = require("fs");
var LR_1 = require("./LR");
var NFAState = /** @class */ (function () {
    function NFAState() {
    }
    return NFAState;
}());
var DFAState = /** @class */ (function () {
    function DFAState() {
    }
    return DFAState;
}());
//class Test {
//    name: string;
//    grammar: string;
//}
function main() {
    var tests = [];
    tests.push(["dfaV1-1", "IF -> \bif\b\nELSE -> \belse\b\nADDOP -> [-+]\nSTARSTAR -> [*][*]\nMULOP -> [* /%]\nNUM -> -?\d +\nID -> [A - Za - z_]\w *\nLP -> [(]\nRP -> [)]\nEQ -> =\nSEMI -> ; \nCMA -> , \n\nS -> stmt S | stmt\nstmt -> assign SEMI | func SEMI | cond\nassign -> ID EQ sum\nfunc -> ID LP plist RP\nplist -> lambda | sum | sum CMA plist'\nplist' -> sum | sum CMA plist'\nsum -> sum ADDOP prod | prod\nprod -> prod MULOP pow | pow\npow -> factor STARSTAR pow | factor\nfactor -> ID | NUM | LP sum RP\ncond -> IF LP sum RP stmt | IF LP sum RP stmt ELSE stmt\n"]);
    tests.forEach(function (t) {
        var name = t[0];
        var grammar = t[1];
        console.log(name);
        var nfa = LR_1.makeNFA(grammar);
        var dfa = LR_1.makeDFA(grammar);
        var dot = outputDotNFA(nfa);
        fs.writeFileSync(name + ".nfa.dot", dot);
        dot = outputDotDFA(dfa, nfa);
        fs.writeFileSync(name + ".dfa.dot", dot);
    });
}
function outputDotNFA(fa) {
    var L;
    L = [];
    L.push("digraph d{");
    L.push("node [fontname=Helvetica,shape=box];");
    L.push("edge [fontname=Helvetica];");
    fa.forEach(function (q, i) {
        var x = q.item.toString();
        x = x.replace(/&/g, "&amp;");
        x = x.replace(/</g, "&lt;");
        x = x.replace(/>/g, "&gt;");
        L.push("n" + i + " [label=<" + i + "<br />" + x + ">];");
    });
    fa.forEach(function (q, i) {
        var e_1, _a;
        var _loop_1 = function (sym) {
            var sym1;
            if (sym === "")
                sym1 = "<&lambda;>";
            else
                sym1 = "\"" + sym + "\"";
            var L2 = q.transitions.get(sym);
            L2.forEach(function (i2) {
                L.push("n" + i + " -> n" + i2 + " [label=" + sym1 + "];");
            });
        };
        try {
            for (var _b = __values(q.transitions.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sym = _c.value;
                _loop_1(sym);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
    L.push("}");
    return L.join("\n");
}
function outputDotDFA(dfa, nfa) {
    var L;
    L = [];
    L.push("digraph d{");
    L.push("node [fontname=Helvetica,shape=box];");
    L.push("edge [fontname=Helvetica];");
    dfa.forEach(function (q, i) {
        var s = [];
        q.label.forEach(function (nfaStateIndex) {
            var nq = nfa[nfaStateIndex];
            var x = nq.item.toString();
            x += " [" + nfaStateIndex + "]";
            x = x.replace(/&/g, "&amp;");
            x = x.replace(/</g, "&lt;");
            x = x.replace(/>/g, "&gt;");
            s.push(x);
        });
        s.sort();
        L.push("n" + i + " [label=<" + i + "<br />" + s.join("<br />") + ">];");
    });
    dfa.forEach(function (q, i) {
        var e_2, _a;
        try {
            for (var _b = __values(q.transitions.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sym = _c.value;
                var sym1 = void 0;
                if (sym === "")
                    sym1 = "<&lambda;>";
                else
                    sym1 = "\"" + sym + "\"";
                var i2 = q.transitions.get(sym);
                L.push("n" + i + " -> n" + i2 + " [label=" + sym1 + "];");
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
    L.push("}");
    return L.join("\n");
}
main();
//# sourceMappingURL=MakeDot.js.map