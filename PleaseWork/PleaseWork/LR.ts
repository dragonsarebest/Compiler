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
    console.log("KEYS: " + key);
    console.log("DFA state map: ");
    console.log(dfaStateMap);

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
    console.log("collected transitions: ");
    console.log(r);
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
function computeClosure2(nfa: NFAState[], stateIndex: number)
{
    let nuff: NFAState = nfa[stateIndex];
    let length: number = 0;
    nuff.closure.forEach((value: number) => {
        let nfaStateToCheck: NFAState = nfa[value];
        let item: LR0Item = nfaStateToCheck.item;
        //as long as the dpos is NOT at the end (indicating we can go nowhere else)
        //find the nonTerminals in the rhs following the dpos, add its closure to this one's
        if (item.dpos > item.rhs.length) {
            let innerIndex: number = item.dpos;
            while (true) {
                if (innerIndex >= item.rhs.length) {
                    break;
                }

                let symbol: string = item.rhs[innerIndex];
                console.log(symbol);
                if (gg.nonTerminalProductions.has(symbol)) {

                    nfa.every((ns: NFAState, nfaNum: number) => {
                        if (ns.item.lhs == symbol) {
                            nuff.closure = union(nuff.closure, ns.closure);
                        }
                    });

                }
                innerIndex++;
            }
        }
    });
}

////second attempt
//function computeClosure3(nfa: NFAState[], stateIndex: number) {
//    let nuff: NFAState = nfa[stateIndex];
//    let innerIndex = nuff.item.dpos;
//    //go through productions starting @ dpos, as long as dpos is not at the end

//    while (true)
//    {
//        if (innerIndex > nuff.item.rhs.length)
//            break;

//        let symbol: string = nuff.item.rhs[innerIndex];

//        //finding say LP * S RP, we should compute transitions on symbol S and add it to the closure

//        if (gg.nonTerminalProductions.has(symbol))
//        {
//            nfa.every((ns: NFAState, nfaNum: number) => {
//                if (ns.item.lhs == symbol) {
//                    nuff.closure = union(nuff.closure, collectTrans(nfa, nfaNum, symbol));
//                }
//            });
//        }

//        innerIndex++;
//    }
//}

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

    let changes: boolean = true;

    while (changes) {
        changes = false;
        nfa.forEach((N: NFAState, index: number) => {
            let len: number = N.closure.size;
            computeClosure2(nfa, index);
            if (len != N.closure.size) {
                changes = true;
            }
        });
        //with thomas's new closure computation
    }

    //final result
    nfa.forEach((N: NFAState, index: number) => {
        console.log("Closure for state " + index);
        console.log(N.closure);
        console.log("transitions");
        console.log(N.transitions);
    });
}

export function makeDFA(input: string) {
    //nfa = NFAState[] list
    //We've already computed the closures
    //nfa[0] is start state

    let nfa = makeNFA(input);
    let dfa: DFAState[] = [];

    containMe(nfa);

    //console.log(nfa[0].closure);

    dfa.push(new DFAState(nfa[0].closure));

    console.log(dfa[0]);

    //initially, we must process DFA start state (index 0)
    let toDo: number[] = [0];

    while (toDo.length > 0) {
        let qi = toDo.pop();
        let q = dfa[qi];

        processState(q, nfa, dfa, toDo);
        dfaStateMap.set(setToString(q.label), qi);
    }
    console.log("Created DFA!");

    console.log("dfa: ");
    console.log(dfa);
    console.log("\n\n\n");
    return dfa;
}