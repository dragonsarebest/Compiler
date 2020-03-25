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
        gg.nonTerminalProductions.get(sym).forEach((P) => {
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
let dfaStateMap = new Map();
function getDFAStateIndexForLabel(sss, dfa, toDo) {
    //given all of the index numbers that correspond to all outgoing nfa states
    let key = Untils_1.setToString(sss);
    //console.log("KEYS: " + key);
    let ddd = new DFAState(sss);
    if (dfaStateMap.has(key)) {
        return dfaStateMap.get(key);
    }
    else {
        let q2i = dfa.length;
        toDo.push(q2i);
        dfa.push(ddd);
        dfaStateMap.set(key, q2i);
        return q2i;
    }
}
function processState(q, nfa, dfa, toDo) {
    let r = collectTransitions(q, nfa);
    for (let sym of r.keys()) {
        //r = set of all possible transitions (excluding lambda transitions)
        //that q can get to on sym
        let ss = r.get(sym);
        //console.log(sym);
        //console.log(ss);
        let q2i = getDFAStateIndexForLabel(ss, dfa, toDo);
        q.addTransition(sym, q2i);
    }
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
    //console.log(dfa);
    //initially, we must process DFA start state (index 0)
    let toDo = [0];
    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];
        processState(q, nfa, dfa, toDo);
        dfaStateMap.set(Untils_1.setToString(q.label), qi);
    }
    //console.log("Created DFA!");
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
    console.log(nfa);
    let dfa = makeDFA(grammarSpec);
    console.log(dfa);
    //let table: Map<number, Map<string, Action>> = new Map();
    let table = [];
    let shiftReduceError = false;
    let reduceReduceError = false;
    dfa.forEach((q, idx) => {
        table.push(new Map());
        //q.transitions is a map: string -> number
        for (let sym of q.transitions.keys()) {
            table[idx].set(sym, new Action("s", q.transitions.get(sym)));
        }
    });
    //all shifts are now done
    //this is for reducing!
    dfa.forEach((q, idx) => {
        //table.set(idx, new Map());
        table.push(new Map());
        //q.transitions is a map: string(LR0Item as a string -> number corresponding to the dfa index)
        //console.log(q);
        //look for this q's symbol in the rhs of any production where it is followed by a dot
        //search NFA table for this q's symbol & if the dpos is the same position as this symbol in the
        //production then we can reduce to this nfa state. now we need to figure out what dfa state this nfa maps to.
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