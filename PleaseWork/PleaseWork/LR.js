"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Grammar_1 = require("./Grammar");
const Untils_1 = require("./Untils");
class LR0Item {
    constructor(lhs, rhs, dpos) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.dpos = dpos;
    }
    toString() {
        let l1 = this.rhs.slice(0, this.dpos);
        let l2 = this.rhs.slice(this.dpos);
        //Unicode 2192 = arrow, 2022=bullet
        return this.lhs + " \u2192 " + l1.join(" ") + " \u2022 " + l2.join(" ");
    }
}
class NFAState {
    constructor(lr0item) {
        this.item = lr0item;
        this.transitions = new Map();
    }
    addTransition(sym, stateIndex) {
        if (!this.transitions.has(sym))
            this.transitions.set(sym, []);
        this.transitions.get(sym).push(stateIndex);
    }
}
class DFAState {
    constructor(label) {
        this.lhs = [];
        this.label = label;
        this.transitions = new Map();
    }
    addTransition(sym, stateIndex) {
        if (this.transitions.has(sym))
            throw new Error("Duplicate transition");
        this.transitions.set(sym, stateIndex);
    }
}
function getStateWithLabel(I2, allStates, toDo, stateMap) {
    let I2s = I2.toString();
    let q2i;
    if (stateMap.has(I2s))
        q2i = stateMap.get(I2s);
    else {
        q2i = allStates.length;
        allStates.push(new NFAState(I2));
        toDo.push(q2i);
        stateMap.set(I2s, q2i);
    }
    return q2i;
}
function makeTransitions(currentState, allStates, toDo, stateMap, gg) {
    if (currentState.item.dpos >= currentState.item.rhs.length)
        return; //nothing to do
    let sym = currentState.item.rhs[currentState.item.dpos];
    if (sym == "")
        return;
    //we cannot have naything before or after "nothing"
    let I2 = new LR0Item(currentState.item.lhs, currentState.item.rhs, currentState.item.dpos + 1);
    let q2i = getStateWithLabel(I2, allStates, toDo, stateMap);
    currentState.addTransition(sym, q2i);
    //console.log("checking symbol:", sym)
    if (gg.nonTerminalProductions.has(sym)) {
        gg.nonTerminalProductions.get(sym).forEach(P => {
            //console.log("production:", P);
            let I2 = new LR0Item(sym, P, 0);
            //console.log("item with label P:", I2);
            let q2i = getStateWithLabel(I2, allStates, toDo, stateMap);
            //console.log("q2i:", q2i);
            currentState.addTransition("", q2i);
        });
    }
}
function makeNFA(input) {
    let gg = new Grammar_1.Grammar(input);
    let allStates = [];
    let startState = new NFAState(new LR0Item("S'", [gg.startNodeLabel], 0));
    allStates.push(startState);
    let stateMap = new Map();
    //list of indices in allStates: The states we need to process
    let toDo = [0];
    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = allStates[qi];
        makeTransitions(q, allStates, toDo, stateMap, gg);
    }
    //console.log("ALL DONE:", allStates);
    return allStates;
}
exports.makeNFA = makeNFA;
function getDFAStateIndexForLabel(sss, dfa, toDo) {
    //given all of the index numbers that correspond to all outgoing nfa states
    let key = Untils_1.setToString(sss);
    //console.log("KEYS: " + key);
    let ddd = new DFAState(sss);
    let found = dfa.findIndex(element => element == ddd);
    if (found == -1) {
        dfa.push(ddd);
        return dfa.length - 1;
    }
    else {
        return found;
    }
}
function processState(q, nfa, dfa, toDo) {
    let statesToStates = [];
    let r = collectTransitions(q, nfa);
    for (let sym of r.keys()) {
        //r = set of all possible transitions (excluding lambda transitions)
        //that q can get to on sym
        let ss = r.get(sym);
        //console.log(sym);
        //console.log(ss);
        let q2i = getDFAStateIndexForLabel(ss, dfa, toDo);
        q.addTransition(sym, q2i);
        r.get(sym).forEach(index => {
            q.lhs.push(nfa[index].item.lhs);
            statesToStates.push(nfa[index]);
        });
    }
    return statesToStates;
}
function collectTransitions(q, nfa) {
    let r = new Map();
    q.label.forEach((nfaStateIndex) => {
        let nq = nfa[nfaStateIndex];
        for (let sym of nq.transitions.keys()) {
            if (sym !== "") {
                if (!r.has(sym))
                    r.set(sym, new Set());
                nq.transitions.get(sym).forEach((x) => {
                    let nq2 = nfa[x];
                    //we need to write union() ourselves
                    r.set(sym, Untils_1.union(r.get(sym), nq2.closure));
                });
            }
        }
    });
    return r;
}
function computeClosure(nfa, stateIndex, closure) {
    closure.add(stateIndex);
    if (nfa[stateIndex].transitions.has("")) {
        //NFAState.transitions is a Map from string to number[]
        nfa[stateIndex].transitions.get("").forEach((index) => {
            if (!closure.has(index)) {
                computeClosure(nfa, index, closure);
            }
        });
    }
}
let NFAtoDFA = new Map();
let dfaStateMap = new Map();
function makeDFA(input) {
    //nfa = NFAState[] list
    //We've already computed the closures
    //nfa[0] is start state
    let nfa = makeNFA(input);
    let dfa = [];
    nfa.forEach((N, index) => {
        let closure = new Set();
        computeClosure(nfa, index, closure);
        N.closure = closure;
    });
    //console.log(nfa[0].closure);
    dfa.push(new DFAState(nfa[0].closure));
    dfa[0].lhs.push(nfa[0].item.lhs);
    //console.log(dfa);
    //initially, we must process DFA start state (index 0)
    let toDo = [0];
    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];
        let listOfNFAStates = processState(q, nfa, dfa, toDo);
        listOfNFAStates.forEach(entry => {
            NFAtoDFA.set(entry, qi);
        });
        dfaStateMap.set(Untils_1.setToString(q.label), qi);
    }
    //console.log("Created DFA!");
    //console.log(NFAtoDFA);
    return dfa;
}
exports.makeDFA = makeDFA;
class Action {
    constructor(a, n, sym) {
        this.action = a;
        this.num = n;
        this.sym = sym; //might be <undefined>
    }
}
function makeTable(grammarSpec) {
    let gg = new Grammar_1.Grammar(grammarSpec);
    let nfa = makeNFA(grammarSpec);
    let dfa = makeDFA(grammarSpec);
    let table = [];
    let shiftReduceError = false;
    let reduceReduceError = false;
    dfa.forEach((q, idx) => {
        console.log(q);
        table.push(new Map());
        //q.transitions is a map: string(LR0Item as a string -> number corresponding to the dfa index)
        let count = 0;
        let rhsSet = new Set();
        console.log(q);
        for (let sym of q.transitions.keys()) {
            //sym is LR0Item as a string
            let trans = q.transitions.get(sym);
            //trans is the index in the dfastate table
            let dff = dfa[trans];
            console.log(dff);
            rhsSet.add(sym);
            //console.log("Transition: ", sym);
            if (count >= q.transitions.size - 1) {
                if (table[idx].get(sym) != undefined) {
                    if (table[idx].get(sym).action == "r") {
                        reduceReduceError = true;
                    }
                    if (table[idx].get(sym).action == "s") {
                        shiftReduceError = true;
                        reduceReduceError = true;
                    }
                }
                table[idx].set(sym, new Action("r", trans, sym));
                //this may or may not be right?
            }
            else {
                if (table[idx].get(sym) != undefined) {
                    if (table[idx].get(sym).action == "s") {
                        shiftReduceError = true;
                    }
                    if (table[idx].get(sym).action == "r") {
                        shiftReduceError = true;
                        reduceReduceError = true;
                    }
                }
                table[idx].set(sym, new Action("s", q.transitions.get(sym)));
            }
            count += 1;
        }
    });
    let error = 0;
    if (shiftReduceError && !reduceReduceError)
        error = 1;
    if (!shiftReduceError && reduceReduceError)
        error = 2;
    if (shiftReduceError && reduceReduceError)
        error = 3;
    let returnValue;
    returnValue = [table, error];
    return returnValue;
}
exports.makeTable = makeTable;
//# sourceMappingURL=LR.js.map