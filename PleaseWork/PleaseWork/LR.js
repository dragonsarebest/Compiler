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
var Grammar_1 = require("./Grammar");
var Untils_1 = require("./Untils");
var LR0Item = /** @class */ (function () {
    function LR0Item(lhs, rhs, dpos) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.dpos = dpos;
        if (this.rhs.length == 1 && this.rhs[0] == "") {
            this.rhs = [];
        }
    }
    LR0Item.prototype.toString = function () {
        var l1 = this.rhs.slice(0, this.dpos);
        var l2 = this.rhs.slice(this.dpos);
        //Unicode 2192 = arrow, 2022=bullet
        return this.lhs + " \u2192 " + l1.join(" ") + " \u2022 " + l2.join(" ");
    };
    LR0Item.prototype.dposAtEnd = function () {
        //console.log(this, this.dpos >= this.rhs.length);
        return this.dpos >= this.rhs.length;
    };
    LR0Item.prototype.itemsEqual = function (item2) {
        if (item2.lhs == this.lhs && item2.rhs == this.rhs && item2.dpos == this.dpos)
            return true;
        return false;
    };
    return LR0Item;
}());
exports.LR0Item = LR0Item;
var NFAState = /** @class */ (function () {
    function NFAState(lr0item) {
        this.item = lr0item;
        this.transitions = new Map();
    }
    NFAState.prototype.addTransition = function (sym, stateIndex) {
        if (!this.transitions.has(sym))
            this.transitions.set(sym, []);
        this.transitions.get(sym).push(stateIndex);
    };
    return NFAState;
}());
exports.NFAState = NFAState;
var DFAState = /** @class */ (function () {
    function DFAState(label) {
        this.label = label;
        this.transitions = new Map();
    }
    DFAState.prototype.addTransition = function (sym, stateIndex) {
        if (this.transitions.has(sym))
            throw new Error("Duplicate transition " + stateIndex);
        this.transitions.set(sym, stateIndex);
    };
    return DFAState;
}());
exports.DFAState = DFAState;
//et lastInput: string;
function setUp(input) {
    //lastInput = input;
    exports.gg = new Grammar_1.Grammar(input);
    dfaStateMap = new Map();
}
function getStateWithLabel(I2, allStates, toDo, stateMap) {
    var I2s = I2.toString();
    var q2i;
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
    var sym = currentState.item.rhs[currentState.item.dpos];
    if (sym == "")
        return;
    //we cannot have anything before or after "nothing"
    var I2 = new LR0Item(currentState.item.lhs, currentState.item.rhs, currentState.item.dpos + 1);
    var q2i = getStateWithLabel(I2, allStates, toDo, stateMap);
    currentState.addTransition(sym, q2i);
    //console.log("checking symbol:", sym)
    if (gg.nonTerminalProductions.has(sym)) {
        gg.nonTerminalProductions.get(sym).forEach(function (P) {
            //console.log("production:", P);
            var I2 = new LR0Item(sym, P, 0);
            //console.log("item with label P:", I2);
            var q2i = getStateWithLabel(I2, allStates, toDo, stateMap);
            //console.log("q2i:", q2i);
            currentState.addTransition("", q2i);
        });
    }
}
function makeNFA(input) {
    setUp(input);
    var allStates = [];
    var startState = new NFAState(new LR0Item("S'", [exports.gg.startNodeLabel], 0));
    allStates.push(startState);
    var stateMap = new Map();
    //list of indices in allStates: The states we need to process
    var toDo = [0];
    while (toDo.length > 0) {
        var qi = toDo.pop();
        var q = allStates[qi];
        makeTransitions(q, allStates, toDo, stateMap, exports.gg);
    }
    //console.log("ALL DONE:", allStates);
    return allStates;
}
exports.makeNFA = makeNFA;
var dfaStateMap;
function getDFAStateIndexForLabel(sss, dfa, toDo) {
    //given all of the index numbers that correspond to all outgoing nfa states
    var key = Untils_1.setToString(sss);
    //console.log("KEY: " + key);
    //console.log("DFA state map: ");
    //console.log(dfaStateMap);
    if (dfaStateMap.has(key)) {
        return dfaStateMap.get(key);
    }
    else {
        var ddd = new DFAState(sss);
        var q2i = dfa.length;
        toDo.push(q2i);
        dfa.push(ddd);
        dfaStateMap.set(key, q2i);
        return q2i;
    }
}
function processState(q, nfa, dfa, toDo) {
    var e_1, _a;
    var r = collectTransitions(q, nfa);
    try {
        //console.log("collected transitions: ");
        //console.log(r);
        for (var _b = __values(r.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var sym = _c.value;
            //r = set of all possible transitions (excluding lambda transitions)
            //that q can get to on sym
            //console.log("transition me");
            var ss = r.get(sym);
            //console.log(sym);
            //console.log(ss);
            var q2i = getDFAStateIndexForLabel(ss, dfa, toDo);
            q.addTransition(sym, q2i);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function collectTransitions(q, nfa) {
    var r = new Map();
    q.label.forEach(function (nfaStateIndex) {
        var e_2, _a;
        var nq = nfa[nfaStateIndex];
        var _loop_1 = function (sym) {
            if (sym !== "") {
                if (!r.has(sym))
                    r.set(sym, new Set());
                nq.transitions.get(sym).forEach(function (x) {
                    var nq2 = nfa[x];
                    //we need to write union() ourselves
                    r.set(sym, Untils_1.union(r.get(sym), nq2.closure));
                });
            }
        };
        try {
            for (var _b = __values(nq.transitions.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sym = _c.value;
                _loop_1(sym);
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
    return r;
}
function computeClosure(nfa, stateIndex, closure) {
    closure.add(stateIndex);
    //console.log(nfa[stateIndex].transitions);
    if (nfa[stateIndex].transitions.has("")) {
        //NFAState.transitions is a Map from string to number[]
        nfa[stateIndex].transitions.get("").forEach(function (index) {
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
    nfa.forEach(function (N, index) {
        var closure = new Set();
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
    var nfa = makeNFA(input);
    var dfa = [];
    containMe(nfa);
    dfa.push(new DFAState(nfa[0].closure));
    //console.log("starting dfa state:")
    //console.log(dfa[0]);
    //console.log(dfa[0].transitions);
    //console.log(dfa[0].label);
    //console.log("===============");
    var toDo = [0];
    while (toDo.length > 0) {
        var qi = toDo.pop();
        var q = dfa[qi];
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
var Action = /** @class */ (function () {
    function Action(a, n, sym) {
        this.action = a;
        this.num = n;
        this.lhs = sym; //might be <undefined>
    }
    return Action;
}());
exports.Action = Action;
function makeTable(grammarSpec) {
    setUp(grammarSpec);
    exports.nfa = makeNFA(grammarSpec);
    exports.dfa = makeDFA(grammarSpec);
    var table = [];
    //since "S'" is not in the grammar but added by the nfa class to prevent loop backs to the start
    //console.log(gg);
    //console.log(gg.follow);
    //console.log(grammarSpec);
    //nfa.forEach((entry: NFAState) => {
    //    console.log(entry);
    //});
    //console.log(nfa);
    //console.log(dfa);
    var shiftReduceError = false;
    var reduceReduceError = false;
    //this is for reducing!
    exports.dfa.forEach(function (q, idx) {
        table.push(new Map());
        //if dpos is at the end & the next token is in the follow of that productions lhs
        //next token = transitions 
        q.label.forEach(function (entry) {
            //for every nfa/production that makes up this dfa
            var production = exports.nfa[entry].item;
            if (production.dposAtEnd()) {
                //console.log(production.lhs);
                var follow = exports.gg.follow.get(production.lhs);
                //get the follow for the lhs of this production
                //console.log(production.lhs, follow);
                if (follow != undefined) {
                    follow.forEach(function (sym) {
                        //if the dpos is at the end of a production, you add an entry in the table
                        //where(table row = DFA state number)
                        //and column = f where f is any symbol in follow of production.lhs
                        //and the content of the table cell(row, column) is["r", lengthOfRHS, SymbolOnLHS]
                        //we reduce!
                        //console.log("\treducing");
                        var inThere = table[idx].get(sym);
                        if (inThere != undefined && inThere.action == "r") {
                            //console.log("\t\treduce-reduce found: error code 2");
                            reduceReduceError = true;
                        }
                        else {
                            table[idx].set(sym, new Action("r", production.rhs.length, production.lhs));
                        }
                    });
                }
            }
        });
    });
    exports.dfa.forEach(function (q, idx) {
        var e_3, _a;
        try {
            //q.transitions is a map: string -> number
            for (var _b = __values(q.transitions.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sym = _c.value;
                var inThere = table[idx].get(sym);
                if (inThere != undefined && inThere.action == "r") {
                    //console.log("\t\treduce-reduce found: error code 2");
                    shiftReduceError = true;
                }
                table[idx].set(sym, new Action("s", q.transitions.get(sym)));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
    });
    //all shifts are now done
    if (table.length == 1) {
        table.push(new Map());
    }
    table[1].set("$", new Action("r", 1, "S'"));
    //console.log("Table so far + reducing: ", table);
    var error = 0;
    if (shiftReduceError && !reduceReduceError)
        error = 1;
    if (!shiftReduceError && reduceReduceError)
        error = 2;
    if (shiftReduceError && reduceReduceError)
        error = 3;
    var returnValue;
    returnValue = [table, error];
    return returnValue;
}
exports.makeTable = makeTable;
//# sourceMappingURL=LR.js.map