import { Grammar } from "./Grammar"
import { union, setToString } from "./Untils"

class LR0Item {
    lhs: string;
    rhs: string[];
    dpos: number;

    constructor(lhs: string, rhs: string[], dpos: number) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.dpos = dpos;
    }
    toString(): string {
        let l1 = this.rhs.slice(0, this.dpos);
        let l2 = this.rhs.slice(this.dpos);
        //Unicode 2192 = arrow, 2022=bullet
        return this.lhs + " \u2192 " + l1.join(" ") + " \u2022 " + l2.join(" ");
    }
}

class NFAState {
    item: LR0Item;
    //key=symbol, value = unique number for an NFAState
    closure: Set<number>;
    transitions: Map<string, number[]>;
    constructor(lr0item: LR0Item) {
        this.item = lr0item;
        this.transitions = new Map();
    }
    addTransition(sym: string, stateIndex: number) {
        if (!this.transitions.has(sym))
            this.transitions.set(sym, []);
        this.transitions.get(sym).push(stateIndex);
    }
}

class DFAState {
    label: Set<number>;
    transitions: Map<string, number>;
    constructor(label: Set<number>) {
        this.label = label;
        this.transitions = new Map();
    }
    addTransition(sym: string, stateIndex: number) {
        if (this.transitions.has(sym))
            throw new Error("Duplicate transition " + stateIndex);
        this.transitions.set(sym, stateIndex);
    }
}

function getStateWithLabel(I2: LR0Item, allStates: NFAState[], toDo: number[], stateMap: Map<string, number>) {
    let I2s = I2.toString();
    let q2i: number;
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

function makeTransitions(currentState: NFAState, allStates: NFAState[], toDo: number[], stateMap: Map<string, number>, gg: Grammar) {
    if (currentState.item.dpos >= currentState.item.rhs.length)
        return;     //nothing to do
    let sym = currentState.item.rhs[currentState.item.dpos];
    if (sym == "")
        return;
    //we cannot have anything before or after "nothing"
    let I2 = new LR0Item(currentState.item.lhs, currentState.item.rhs, currentState.item.dpos + 1);
    let q2i = getStateWithLabel(I2, allStates, toDo, stateMap);
    currentState.addTransition(sym, q2i);
    //console.log("checking symbol:", sym)
    if (gg.nonTerminalProductions.has(sym)) {
        gg.nonTerminalProductions.get(sym).forEach((P: string[]) => {
            //console.log("production:", P);
            let I2 = new LR0Item(sym, P, 0);
            //console.log("item with label P:", I2);
            let q2i = getStateWithLabel(I2, allStates, toDo, stateMap)
            //console.log("q2i:", q2i);
            currentState.addTransition("", q2i);
        });
    }
}

let gg: Grammar;

export function makeNFA(input: string) {
    gg = new Grammar(input);
    dfaStateMap = new Map();
    let allStates: NFAState[] = [];

    let startState = new NFAState(new LR0Item("S'", [gg.startNodeLabel], 0));
    allStates.push(startState);

    let stateMap = new Map<string, number>();

    //list of indices in allStates: The states we need to process
    let toDo: number[] = [0];

    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = allStates[qi];
        makeTransitions(q, allStates, toDo, stateMap, gg);
    }
    //console.log("ALL DONE:", allStates);

    return allStates;
}

let dfaStateMap: Map<string, number>;
function getDFAStateIndexForLabel(sss: Set<number>, dfa: DFAState[], toDo: number[]) {
    //given all of the index numbers that correspond to all outgoing nfa states
    let key = setToString(sss);
    //console.log("KEY: " + key);
    //console.log("DFA state map: ");
    //console.log(dfaStateMap);
    
    if (dfaStateMap.has(key)) {
        return dfaStateMap.get(key);
    }
    else {
        let ddd: DFAState = new DFAState(sss);
        let q2i: number = dfa.length;
        toDo.push(q2i);
        dfa.push(ddd);
        dfaStateMap.set(key, q2i);
        return q2i;
    }
}
//look @ current DFA state DQ
//for every symbol possible, S
//consider every NFA state in DQ's label as NQ
//for every NQ, list of NFA states you can reach from NQ on s
//union that list w/ all of the closures of all the NFA states you could reach via s
//make a transition from the current DQ to a new DQ w/ label s
//repeat until no new changes
function processState(q: DFAState, nfa: NFAState[], dfa: DFAState[], toDo: number[]) {
    let r: Map<string, Set<number>> = collectTransitions(q, nfa);
    //console.log("collected transitions: ");
    //console.log(r);
    for (let sym of r.keys()) {
        //r = set of all possible transitions (excluding lambda transitions)
        //that q can get to on sym
        //console.log("transition me");
        let ss: Set<number> = r.get(sym);
        //console.log(sym);
        //console.log(ss);

        let q2i: number = getDFAStateIndexForLabel(ss, dfa, toDo);
        q.addTransition(sym, q2i)
    }
}

function collectTransitions(q: DFAState, nfa: NFAState[]) {
    let r: Map<string, Set<number>> = new Map();
    
    q.label.forEach((nfaStateIndex: number) => {
        let nq = nfa[nfaStateIndex];
        for (let sym of nq.transitions.keys()) {
            if (sym !== "") {
                if (!r.has(sym))
                    r.set(sym, new Set());
                nq.transitions.get(sym).forEach((x: number) => {
                    let nq2 = nfa[x];

                    //we need to write union() ourselves
                    r.set(sym, union(r.get(sym), nq2.closure));
                });
            }
        }
    });
    
    return r;
}

function computeClosure(nfa: NFAState[], stateIndex: number, closure: Set<number>) {
    closure.add(stateIndex);
    //console.log(nfa[stateIndex].transitions);
    if (nfa[stateIndex].transitions.has("")) {
        //NFAState.transitions is a Map from string to number[]
        nfa[stateIndex].transitions.get("").forEach((index: number) => {
            if (!closure.has(index)) {
                computeClosure(nfa, index, closure);
            }
        });
    }
}

function containMe(nfa: NFAState[])
{
    nfa.forEach((value: NFAState, index: number) => {
        console.log(index + "::" + value.item);
    });

    nfa.forEach((N: NFAState, index: number) => {
        let closure: Set<number> = new Set();
        computeClosure(nfa, index, closure);
        N.closure = closure;
        //preliminary closure
    });

    //final result
    nfa.forEach((N: NFAState, index: number) => {
        console.log("Closure for state " + index);
        console.log(N.closure);
        console.log("transitions");
        console.log(N.transitions);
    });
}



export function makeDFA(input: string) {
    let nfa = makeNFA(input);
    let dfa: DFAState[] = [];

    containMe(nfa);

    dfa.push(new DFAState(nfa[0].closure));

    console.log("starting dfa state:")
    console.log(dfa[0]);
    console.log(dfa[0].transitions);
    console.log(dfa[0].label);
    console.log("===============");

    let toDo: number[] = [0];

    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];

        processState(q, nfa, dfa, toDo);
        //dfaStateMap.set(setToString(q.label), qi);
    }
    console.log("Created DFA!");

    console.log("dfa: ");
    console.log(dfa);
    console.log("\n\n\n");
    return dfa;
}