"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Token {
    constructor(sym, lexeme, line) {
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
exports.Token = Token;
//# sourceMappingURL=Token.js.map