import { Token } from "./Token"
import { Grammar } from "./Grammar"

export class Tokenizer {
    grammar: Grammar;
    inputData: string;
    currentLine: number;
    idx: number;    //index of next unparsed char in inputData
    previous: Token;
    current: Token;

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.previous = null;
        this.current = null;
    }

    setInput(inputData: string) {
        this.inputData = inputData;
        this.currentLine = 1;
        this.idx = 0;

        //console.log("got this data for tokenization: " + inputData);
    }

    peek(): Token {
        let currentLine = this.currentLine;
        let idx = this.idx;
        let current = this.current;
        let previous = this.previous;

        //console.log("\tprevious");
        //console.log("\tcurrentLine: ", currentLine);
        //console.log("\tidx:         ", idx);
        //console.log("\tcurrent:     ", current);
        //console.log("\tprevious:    ", previous);

        let returnVal: Token = this.next(true);

        this.currentLine = currentLine;
        this.idx = idx;
        this.current = current;
        this.previous = previous;

        //console.log("\tnow");
        //console.log("\tcurrentLine: ", this.currentLine);
        //console.log("\tidx:         ", this.idx);
        //console.log("\tcurrent:     ", this.current);
        //console.log("\tprevious:    ", this.previous);

        //console.log("\t", returnVal);

        //console.log("inputLength: ", this.inputData.length);

        return returnVal;
    }

    next(printStuff: boolean = false): Token {

        //console.log(this.grammar.terminals);

        //if (printStuff) {
        //    console.log("idx:             ", this.idx);
        //    console.log("input length -1: ", this.inputData.length-1)
        //}

        //console.log("next");
        if (this.idx > this.inputData.length - 1) {
            //special "end of file" metatoken
            //if (printStuff) {
            //    console.log("\treturning END");
            //}
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

                let temp = this.currentLine;
                let i = lexeme.split("\n");
                this.currentLine += i.length - 1;

                if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                    let token = new Token(sym, lexeme, temp);
                    this.previous = this.current;
                    this.current = token;
                    //if (printStuff)
                    //    console.log(token);
                    
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