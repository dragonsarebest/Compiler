"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("./Token");
class Tokenizer {
    constructor(grammar) {
        this.grammar = grammar;
    }
    setInput(inputData) {
        this.inputData = inputData;
        this.currentLine = 1;
        this.idx = 0;
        //console.log("got this data for tokenization: " + inputData);
    }
    next() {
        if (this.idx >= this.inputData.length - 1) {
            //special "end of file" metatoken
            return new Token_1.Token("$", undefined, this.currentLine);
        }
        for (let i = 0; i < this.grammar.terminals.length; ++i) {
            let terminal = this.grammar.terminals[i];
            let sym = terminal.sym;
            let rex = terminal.rex; //RegExp
            rex.lastIndex = this.idx; //tell where to start searching
            let m = rex.exec(this.inputData); //do the search
            if (m) {
                //m[0] contains matched text as string
                let lexeme = m[0];
                this.idx += lexeme.length;
                let i = lexeme.split("\n");
                this.currentLine += i.length - 1;
                if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                    //return new Token using sym, lexeme, and line number
                    let token = new Token_1.Token(sym, lexeme, this.currentLine);
                    //console.log("created token: " + token);
                    return token;
                }
                else {
                    //skip whitespace and get next real token
                    //console.log("Whitespace found!");
                    return this.next();
                }
            }
        }
        //no match; syntax error
        throw new Error("No match found for: " + this.inputData.substr(this.idx) + "\nAt line: " + this.currentLine);
    }
}
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=Tokenizer.js.map