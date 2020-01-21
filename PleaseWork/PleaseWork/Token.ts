export class Token {
    sym: string;
    lexeme: string;
    line: number;
    constructor(sym: string, lexeme: string, line: number) {
        this.sym = sym;
        this.lexeme = lexeme;
        this.line = line;
    }
    toString() {
        let sym = this.sym.padStart(20, ' ');
        let line = "" + this.line;
        line = line.padEnd(4, ' ');
        return `[${sym} ${line} ${this.lexeme}]`;
    }
}