import { Token } from "./Token"
import { Grammar } from "./Grammar"

export class Tokenizer
{
    grammar: Grammar;
    inputData: string;
    currentLine: number;
    idx: number;    //index of next unparsed char in inputData

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.previous = undefined;
    }

    setInput(inputData: string) {
        this.inputData = inputData;
        this.currentLine = 1;
        this.idx = 0;

        //console.log("got this data for tokenization: " + inputData);
    }

    previous() : Token
    {
        let tempIDX = this.idx;
        let tempCurrentLine = this.currentLine;
        let prev = this.next();
        this.idx = tempIDX;
        this.currentLine = tempCurrentLine;
        return prev;
    }

    next() : Token
    {
        if (this.idx >= this.inputData.length-1) {
            //special "end of file" metatoken
            return new Token("$", undefined, this.currentLine);
        }

        for (let i = 0; i < this.grammar.terminals.length; ++i) {
            let terminal = this.grammar.terminals[i];
            let sym = terminal.sym;
            let rex = terminal.rex;     //RegExp

            rex.lastIndex = this.idx;   //tell where to start searching
            let m = rex.exec(this.inputData);   //do the search
            if (m) {

                //m[0] contains matched text as string
                let lexeme = m[0];
                this.idx += lexeme.length;

                let i = lexeme.split("\n");
                this.currentLine += i.length-1;
                

                if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                    //return new Token using sym, lexeme, and line number
                    let token = new Token(sym, lexeme, this.currentLine);
                    //console.log("created token: " + token);
                    return token;
                } else {
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