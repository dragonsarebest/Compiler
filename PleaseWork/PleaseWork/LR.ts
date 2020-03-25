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
            throw new Error("Duplicate transition");
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
    //we cannot have naything before or after "nothing"
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

export function makeNFA(input: string) {
    let gg = new Grammar(input);
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

let dfaStateMap: Map<string, number> = new Map();
function getDFAStateIndexForLabel(sss: Set<number>, dfa: DFAState[], toDo: number[]) {
    //given all of the index numbers that correspond to all outgoing nfa states
    let key = setToString(sss);
    //console.log("KEYS: " + key);

    let ddd: DFAState = new DFAState(sss);
    if (dfaStateMap.has(key)) {
        return dfaStateMap.get(key);
    }
    else {
        let q2i: number = dfa.length;
        toDo.push(q2i);
        dfa.push(ddd);
        dfaStateMap.set(key, q2i);
        return q2i;
    }
}

function processState(q: DFAState, nfa: NFAState[], dfa: DFAState[], toDo: number[]) {
    let r: Map<string, Set<number>> = collectTransitions(q, nfa);
    for (let sym of r.keys()) {
        //r = set of all possible transitions (excluding lambda transitions)
        //that q can get to on sym
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
                    r.set(sym, union(r.get(sym), nq2.closure))
                });
            }
        }
    });
    return r;
}


function computeClosure(nfa: NFAState[], stateIndex: number, closure: Set<number>) {
    closure.add(stateIndex);
    if (nfa[stateIndex].transitions.has("")) {
        //NFAState.transitions is a Map from string to number[]
        nfa[stateIndex].transitions.get("").forEach((index: number) => {
            if (!closure.has(index)) {
                computeClosure(nfa, index, closure);
            }
        });
    }
}

export function makeDFA(input: string) {
    //nfa = NFAState[] list
    //We've already computed the closures
    //nfa[0] is start state

    let nfa = makeNFA(input);
    let dfa: DFAState[] = [];

    nfa.forEach((N: NFAState, index: number) => {
        let closure: Set<number> = new Set();
        computeClosure(nfa, index, closure);
        N.closure = closure;
    });

    //console.log(nfa[0].closure);

    dfa.push(new DFAState(nfa[0].closure));

    //console.log(dfa);

    //initially, we must process DFA start state (index 0)
    let toDo: number[] = [0];

    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];

        processState(q, nfa, dfa, toDo);
        dfaStateMap.set(setToString(q.label), qi);
    }
    //console.log("Created DFA!");
    return dfa;
}



class Action {
    action: string; //'s' or 'r'
    num: number;    //state number for shift, rhs length for reduce
    //the following are only used for reduce
    sym: string;   //lhs symbol
    constructor(a: string, n: number, sym?: string) {
        this.action = a;
        this.num = n;
        this.sym = sym;     //might be <undefined>
    }
}

export function makeTable(grammarSpec: string)
{
    let gg: Grammar = new Grammar(grammarSpec);
    let nfa: NFAState[] = makeNFA(grammarSpec);
    console.log(nfa);
    let dfa: DFAState[] = makeDFA(grammarSpec);
    console.log(dfa);
    //let table: Map<number, Map<string, Action>> = new Map();
    let table: Map<string, Action>[] = [];

    let shiftReduceError: boolean = false;
    let reduceReduceError: boolean = false;

    dfa.forEach((q: DFAState, idx: number) => {
        table.push(new Map());
        //q.transitions is a map: string -> number
        for (let sym of q.transitions.keys()) {
            table[idx].set(sym, new Action("s", q.transitions.get(sym)));
        }
    });
    //all shifts are now done

    //this is for reducing!
    dfa.forEach((q: DFAState, idx: number) =>
    {
        //table.set(idx, new Map());
        table.push(new Map());
        //q.transitions is a map: string(LR0Item as a string -> number corresponding to the dfa index)
        console.log(q);

        //look for this q's symbol in the rhs of any production where it is followed by a dot
        //search NFA table for this q's symbol & if the dpos is the same position as this symbol in the
        //production then we can reduce to this nfa state. now we need to figure out what dfa state this nfa maps to.
        let sym: string = "";
        nfa.every((n: NFAState, inx: number) => {
            let found = n.item.rhs.every((value: string, inx: number) => {
                if (value == sym)
                {
                    if (n.item.dpos == inx)
                    {
                        return false;
                    }
                    return false;
                }
                return true;
            });
            if (found == false)
            {

            }
        });
    });

    let error: number = 0;
    if (shiftReduceError && !reduceReduceError)
        error = 1;
    if (!shiftReduceError && reduceReduceError)
        error = 2;
    if (shiftReduceError && reduceReduceError)
        error = 3;
    let returnValue: [Map<string, any>[], number];
    
    returnValue = [table, error];
    return returnValue;
}