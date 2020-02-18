import { Grammar } from "./Grammar"

class LR0Item
{
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

function getStateWithLabel(I2: LR0Item, allStates: NFAState[], toDo: number[], stateMap: Map<string, number>)
{
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

function makeTransitions(currentState: NFAState, allStates: NFAState[], toDo: number[], stateMap: Map<string, number>, gg: Grammar)
{
    if (currentState.item.dpos >= currentState.item.rhs.length)
        return;     //nothing to do
    let sym = currentState.item.rhs[currentState.item.dpos];
    if (sym == "")
        return;
    //we cannot have naything before or after "nothing"
    let I2 = new LR0Item(currentState.item.lhs, currentState.item.rhs, currentState.item.dpos + 1);
    let q2i = getStateWithLabel(I2, allStates, toDo, stateMap);
    currentState.addTransition(sym, q2i);
    console.log("checking symbol:", sym)
    if (gg.nonTerminalProductions.has(sym))
    {
        gg.nonTerminalProductions.get(sym).forEach(P => {
                console.log("production:", P);
                let I2 = new LR0Item(sym, P, 0);
                console.log("item with label P:", I2);
                let q2i = getStateWithLabel(I2, allStates, toDo, stateMap)
                console.log("q2i:", q2i);
                currentState.addTransition("", q2i);
        });
    }
}

export function makeNFA(input : string)
{
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
    console.log("ALL DONE:", allStates);

    return allStates;
}