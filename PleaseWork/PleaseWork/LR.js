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
    if (currentState.item.dpos >= currentState.item.rhs.length)
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
let gg;
function makeNFA(input) {
    gg = new Grammar_1.Grammar(input);
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
    console.log("KEYS: " + key);
    console.log("DFA state map: ");
    console.log(dfaStateMap);
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
    console.log("collected transitions: ");
    console.log(r);
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
function collectTrans(nfa, index, sym) {
    let closure = new Set();
    let nq = nfa[index];
    if (sym !== "") {
        nq.transitions.get(sym).forEach((x) => {
            let nq2 = nfa[x];
            //we need to write union() ourselves
            closure = Untils_1.union(closure, nq2.closure);
        });
    }
    return closure;
}
/*
private void computeClosure(HashSet < LR0Item > stateItems)
{
    int stateIndex = 0;
    List < LR0Item > toConsider = stateItems.ToList();

    while (stateIndex < toConsider.Count) {
        LR0Item item = toConsider[stateIndex];
        stateIndex++;
        if (!item.DposAtEnd()) {
            string sym = item.Rhs[item.Dpos];
            if (productionDict.ContainsKey(sym)) //nonterminal
            {
                foreach(string p in productionDict[sym].productions)
                {
                    LR0Item item2 = new LR0Item(sym, getProductionAsList(p), 0);
                    if (!stateItems.Contains(item2)) {
                        stateItems.Add(item2);
                        toConsider.Add(item2);
                    }
                }
            }
        }
    }
}
*/
//in accordance w/ thomas
function computeClosure2(nfa, stateIndex) {
    let nuff = nfa[stateIndex];
    let length = 0;
    nuff.closure.forEach((value) => {
        let nfaStateToCheck = nfa[value];
        let item = nfaStateToCheck.item;
        //as long as the dpos is NOT at the end (indicating we can go nowhere else)
        //find the nonTerminals in the rhs following the dpos, add its closure to this one's
        if (item.dpos > item.rhs.length) {
            let innerIndex = item.dpos;
            while (true) {
                if (innerIndex >= item.rhs.length) {
                    break;
                }
                let symbol = item.rhs[innerIndex];
                console.log(symbol);
                if (gg.nonTerminalProductions.has(symbol)) {
                    nfa.every((ns, nfaNum) => {
                        if (ns.item.lhs == symbol) {
                            nuff.closure = Untils_1.union(nuff.closure, ns.closure);
                        }
                    });
                }
                innerIndex++;
            }
        }
    });
}
function computeClosure3(nfa, stateIndex) {
    let nuff = nfa[stateIndex];
    let innerIndex = nuff.item.dpos;
    //go through productions starting @ dpos, as long as dpos is not at the end
    while (true) {
        if (innerIndex > nuff.item.rhs.length)
            break;
        let symbol = nuff.item.rhs[innerIndex];
        //finding say LP * S RP, we should compute transitions on symbol S and add it to the closure
        if (gg.nonTerminalProductions.has(symbol)) {
            nfa.every((ns, nfaNum) => {
                if (ns.item.lhs == symbol) {
                    nuff.closure = Untils_1.union(nuff.closure, collectTrans(nfa, nfaNum, symbol));
                }
            });
        }
        innerIndex++;
    }
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
    nfa.forEach((value, index) => {
        console.log(index + "::" + value.item);
    });
    nfa.forEach((N, index) => {
        let closure = new Set();
        computeClosure(nfa, index, closure);
        N.closure = closure;
        //preliminary closure
    });
    let changes = true;
    while (changes) {
        changes = false;
        nfa.forEach((N, index) => {
            let len = N.closure.size;
            computeClosure3(nfa, index);
            if (len != N.closure.size) {
                changes = true;
            }
        });
        //with thomas's new closure computation
    }
    //final result
    nfa.forEach((N, index) => {
        console.log("Closure for state " + index);
        console.log(N.closure);
        console.log("transitions");
        console.log(N.transitions);
    });
}
function makeDFA(input) {
    //nfa = NFAState[] list
    //We've already computed the closures
    //nfa[0] is start state
    let nfa = makeNFA(input);
    let dfa = [];
    containMe(nfa);
    //console.log(nfa[0].closure);
    dfa.push(new DFAState(nfa[0].closure));
    console.log(dfa[0]);
    //initially, we must process DFA start state (index 0)
    let toDo = [0];
    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];
        processState(q, nfa, dfa, toDo);
        dfaStateMap.set(Untils_1.setToString(q.label), qi);
    }
    console.log("Created DFA!");
    console.log("dfa: ");
    console.log(dfa);
    console.log("\n\n\n");
    return dfa;
}
exports.makeDFA = makeDFA;
//# sourceMappingURL=LR.js.map