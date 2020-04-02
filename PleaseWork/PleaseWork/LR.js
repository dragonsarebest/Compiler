"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Grammar_1 = require("./Grammar");
const Untils_1 = require("./Untils");
let gg;
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
    dposAtEnd() {
        return this.dpos >= this.rhs.length;
    }
    itemsEqual(item2) {
        if (item2.lhs == this.lhs && item2.rhs == this.rhs && item2.dpos == this.dpos)
            return true;
        return false;
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
            throw new Error("Duplicate transition " + stateIndex);
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
    if (currentState.item.dposAtEnd())
        return; //nothing to do
    let sym = currentState.item.rhs[currentState.item.dpos];
    if (sym == "")
        return;
    //we cannot have anything before or after "nothing"
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
    gg = new Grammar_1.Grammar(input);
    dfaStateMap = new Map();
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
let dfaStateMap;
function getDFAStateIndexForLabel(sss, dfa, toDo) {
    //given all of the index numbers that correspond to all outgoing nfa states
    let key = Untils_1.setToString(sss);
    //console.log("KEY: " + key);
    //console.log("DFA state map: ");
    //console.log(dfaStateMap);
    if (dfaStateMap.has(key)) {
        return dfaStateMap.get(key);
    }
    else {
        let ddd = new DFAState(sss);
        let q2i = dfa.length;
        toDo.push(q2i);
        dfa.push(ddd);
        dfaStateMap.set(key, q2i);
        return q2i;
    }
}
function processState(q, nfa, dfa, toDo) {
    let r = collectTransitions(q, nfa);
    //console.log("collected transitions: ");
    //console.log(r);
    for (let sym of r.keys()) {
        //r = set of all possible transitions (excluding lambda transitions)
        //that q can get to on sym
        //console.log("transition me");
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
    //console.log(nfa[stateIndex].transitions);
    if (nfa[stateIndex].transitions.has("")) {
        //NFAState.transitions is a Map from string to number[]
        nfa[stateIndex].transitions.get("").forEach((index) => {
            if (!closure.has(index)) {
                computeClosure(nfa, index, closure);
            }
        });
    }
}
function containMe(nfa) {
    //nfa.forEach((value: NFAState, index: number) => {
    //    console.log(index + "::" + value.item);
    //});
    nfa.forEach((N, index) => {
        let closure = new Set();
        computeClosure(nfa, index, closure);
        N.closure = closure;
        //preliminary closure
    });
    //final result
    //nfa.forEach((N: NFAState, index: number) => {
    //    console.log("Closure for state " + index);
    //    console.log(N.closure);
    //    console.log("transitions");
    //    console.log(N.transitions);
    //});
}
function makeDFA(input) {
    let nfa = makeNFA(input);
    let dfa = [];
    containMe(nfa);
    dfa.push(new DFAState(nfa[0].closure));
    //console.log("starting dfa state:")
    //console.log(dfa[0]);
    //console.log(dfa[0].transitions);
    //console.log(dfa[0].label);
    //console.log("===============");
    let toDo = [0];
    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];
        processState(q, nfa, dfa, toDo);
        //dfaStateMap.set(setToString(q.label), qi);
    }
    //console.log("Created DFA!");
    //console.log("dfa: ");
    //console.log(dfa);
    //console.log("\n\n\n");
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
class FAState {
    constructor(dfa, index) {
        this.state = dfa;
        this.dfaIndex = index;
    }
}
function makeTable(grammarSpec) {
    let nfa = makeNFA(grammarSpec);
    //nfa.forEach((n: NFAState) => {
    //    console.log(n);
    //});
    //console.log(nfa);
    let dfa = makeDFA(grammarSpec);
    //console.log(dfa);
    //let table: Map<number, Map<string, Action>> = new Map();
    let table = [];
    for (let i of dfa) {
        table.push(new Map());
    }
    //initalizes the table for every dfa state
    let shiftReduceError = false;
    let reduceReduceError = false;
    {
        //let seen: FAState[] = []
        //let stack: FAState[] = [];
        //let currentState: FAState = new FAState(dfa[0], 0);
        //stack.push(currentState);
        //while (stack.length > 0)
        //{
        //    while (seen.includes(currentState))
        //        currentState = stack.pop();
        //    //while we have already seen this fastate
        //    currentState = stack.pop();
        //    console.log(currentState);
        //    let currentDFA: DFAState = currentState.state;
        //    let index: number = currentState.dfaIndex;
        //    for (let sym of currentDFA.transitions.keys())
        //    {
        //        let newIndex: number = currentDFA.transitions.get(sym);
        //        table[index].set(sym, new Action("s", newIndex, sym));
        //        stack.push(new FAState(dfa[newIndex], newIndex));
        //    }
        //    currentDFA.label.forEach((entry: number) => {
        //        //for every nfa/production that makes up this dfa
        //        let production = nfa[entry].item;
        //        //console.log(production, production.rhs.length);
        //        if (production.dposAtEnd()) {
        //            let follow = gg.follow.get(production.lhs);
        //            //get the follow for the lhs of this production
        //            //console.log("Num Transitions: ", q.transitions.size);
        //            currentDFA.transitions.forEach((transIndex: number, sym: string) => {
        //                if (follow != undefined && follow.has(sym)) {
        //                    //we reduce!
        //                    //console.log("\treducing");
        //                    let inThere = table[index].get(sym);
        //                    if (inThere != undefined && inThere.action == "s") {
        //                        //console.log("\t\tshift reduce found");
        //                        shiftReduceError = true;
        //                    }
        //                    if (inThere != undefined && inThere.action == "r") {
        //                        //console.log("\t\treduce-reduce found");
        //                        reduceReduceError = true;
        //                    }
        //                    for (let i: number = 0; i < production.rhs.length; i++)
        //                    {
        //                        stack.pop();
        //                    }
        //                    let tempState: FAState = stack.pop();
        //                    stack.push(tempState);
        //                    let reduceIndex: number = tempState.state.transitions.get(production.lhs);
        //                    stack.push(new FAState(dfa[reduceIndex], reduceIndex));
        //                    table[index].set(sym, new Action("r", reduceIndex, production.lhs));
        //                }
        //            });
        //        }
        //    });
        //    seen.push(currentState);
        //}
    }
    dfa.forEach((q, idx) => {
        table.push(new Map());
        //q.transitions is a map: string -> number
        for (let sym of q.transitions.keys()) {
            table[idx].set(sym, new Action("s", q.transitions.get(sym), sym));
        }
    });
    //all shifts are now done
    //console.log("Table so far: ", table);
    //console.log(gg);
    //this is for reducing!
    dfa.forEach((q, idx) => {
        //if dpos is at the end & the next token is in the follow of that productions lhs
        //next token = transitions 
        q.label.forEach((entry) => {
            //for every nfa/production that makes up this dfa
            let production = nfa[entry].item;
            //console.log(production, production.rhs.length);
            if (production.dposAtEnd()) {
                let follow = gg.follow.get(production.lhs);
                //get the follow for the lhs of this production
                //console.log("Num Transitions: ", q.transitions.size);
                q.transitions.forEach((transIndex, sym) => {
                    if (follow != undefined && follow.has(sym)) {
                        //we reduce!
                        //console.log("\treducing");
                        let inThere = table[idx].get(sym);
                        if (inThere != undefined && inThere.action == "s") {
                            //console.log("\t\tshift reduce found");
                            shiftReduceError = true;
                        }
                        if (inThere != undefined && inThere.action == "r") {
                            //console.log("\t\treduce-reduce found");
                            reduceReduceError = true;
                        }
                        table[idx].set(sym, new Action("r", transIndex, production.lhs));
                    }
                });
            }
        });
    });
    console.log("Table so far + reducing: ", table);
    let error = 0;
    if (shiftReduceError)
        error = 1;
    if (reduceReduceError)
        error = 2;
    if (shiftReduceError && reduceReduceError)
        error = 3;
    let returnValue;
    returnValue = [table, error];
    return returnValue;
}
exports.makeTable = makeTable;
//# sourceMappingURL=LR.js.map