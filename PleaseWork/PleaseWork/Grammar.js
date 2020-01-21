"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class terminal {
    constructor(sym, rex) {
        this.sym = sym;
        this.rex = rex;
    }
}
class Grammar {
    constructor(input) {
        this.terminals = [];
        let lines = input.split("\n");
        let expression = new RegExp("([^ ]*)( -> )(.*)", "i");
        let s = new Set();
        this.terminals.push(new terminal("WHITESPACE", new RegExp("\\s+", "gy")));
        lines.forEach(element => {
            let match = expression.exec(element);
            if (match) {
                let left = match[1].trim();
                //console.log("left:" + left);
                //console.log("middle:" + match[2]);
                //console.log("right:" + match[3]);
                let regex;
                try {
                    regex = new RegExp(match[3], "gy");
                }
                catch (_a) {
                    throw "Righthandside is not a propperly formatted regex expression!";
                }
                if (s.has(left)) {
                    throw "Lefthandside has been defined more than once!";
                }
                else {
                    s.add(left);
                }
                this.terminals.push(new terminal(left, regex));
            }
            else {
                if (element.length > 0) {
                    //console.log("WRONG:::" + element);
                    throw "Grammar is impropperly formatted!";
                }
            }
        });
        console.log(this.terminals);
    }
}
exports.Grammar = Grammar;
//# sourceMappingURL=Grammar.js.map