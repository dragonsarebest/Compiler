"use strict";
exports.__esModule = true;
var labelCounter = 0;
var printProgress = true;
function makeAsm(root) {
    exports.asmCode = [];
    labelCounter = 0;
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    programNodeCode(root);
    emit("ret");
    emit("section .data");
    return exports.asmCode.join("\n");
}
exports.makeAsm = makeAsm;
function ICE() {
    //internal compiler error
    var errorMsg = "\tInternal Compiler Error!";
    console.log(errorMsg);
    throw new Error(errorMsg);
}
var VarType;
(function (VarType) {
    VarType[VarType["INTEGER"] = 0] = "INTEGER";
})(VarType || (VarType = {}));
function emit(instr) {
    exports.asmCode.push(instr);
}
function programNodeCode(n) {
    //program -> braceblock
    if (printProgress) {
        console.log(n);
    }
    if (n.sym != "program")
        ICE();
    braceblockNodeCode(n.children[0]);
}
function braceblockNodeCode(n) {
    //braceblock -> LBR stmts RBR
    if (printProgress) {
        console.log(n);
    }
    stmtsNodeCode(n.children[1]);
}
function stmtsNodeCode(n) {
    //stmts -> stmt stmts | lambda
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length == 0)
        return;
    stmtNodeCode(n.children[0]);
    stmtsNodeCode(n.children[1]);
}
function stmtNodeCode(n) {
    //stmt -> cond | loop | return-stmt SEMI
    if (printProgress) {
        console.log(n);
    }
    var c = n.children[0];
    switch (c.sym) {
        case "cond":
            condNodeCode(c);
            break;
        case "loop":
            loopNodeCode(c);
            break;
        case "return-stmt":
            returnstmtNodeCode(c);
            break;
        default:
            ICE();
    }
}
function returnstmtNodeCode(n) {
    //return-stmt -> RETURN expr
    if (printProgress) {
        console.log(n);
    }
    exprNodeCode(n.children[1]);
    emit("pop rax");
    emit("ret");
}
function factorNodeCode(n) {
    //factor -> NUM | LP expr RP
    if (printProgress) {
        console.log(n);
    }
    var child = n.children[0];
    switch (child.sym) {
        case "NUM":
            var v = parseInt(child.token.lexeme, 10);
            emit("push qword " + v);
            return VarType.INTEGER;
        case "LP":
            return exprNodeCode(n.children[1]);
        default:
            ICE();
            return undefined;
    }
}
function sumNodeCode(n) {
    //sum -> sum PLUS term | sum MINUS term | term
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length === 1)
        //sum -> term
        return termNodeCode(n.children[0]);
    else {
        var sumType = sumNodeCode(n.children[0]);
        var termType = termNodeCode(n.children[2]);
        if (sumType !== termType || termType != VarType.INTEGER) {
            throw new Error("Tried to add or subtract two items of differnt types: " + sumType + " and " + termType + " @line number " + n.token.line);
        }
        emit("pop rbx"); //second operand
        emit("pop rax"); //first operand
        switch (n.children[1].sym) {
            case "PLUS":
                emit("add rax, rbx");
                break;
            case "MINUS":
                emit("sub rax, rbx");
                break;
            default:
                ICE();
        }
        emit("push rax");
        return sumType;
    }
}
function exprNodeCode(n) {
    if (printProgress) {
        console.log(n);
    }
    return orexpNodeCode(n.children[0]);
}
function convertStackTopToZeroOrOneInteger(type, invert) {
    if (invert === void 0) { invert = 0; }
    if (type == VarType.INTEGER) {
        emit("cmp qword [rsp], " + invert);
        emit("setne al");
        emit("movzx rax, al");
        emit("mov [rsp], rax");
    }
    else {
        throw new Error("Tried to convert a non-integer into a truthy/falsy value: " + type);
    }
}
function orexpNodeCode(n) {
    //orexp ? orexp OR andexp | andexp
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length === 1) {
        return andexpNodeCode(n.children[0]);
    }
    else {
        var orexpType = orexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(orexpType);
        //is the first part of the or expressin true
        var endOfComp = label();
        emit("cmp qword [rsp], 0");
        emit("jne " + endOfComp);
        //if it was true then we dont need to evaluate the rest
        emit("add rsp,8"); //discard left result (0)
        var andexpType = andexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(andexpType);
        emit(endOfComp + ":");
        return VarType.INTEGER; //always integer, even if float operands
    }
}
function andexpNodeCode(n) {
    //andexp ? andexp AND notexp | notexp
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length === 1) {
        //notexp
        return notexpNodeCode(n.children[0]);
    }
    else {
        //andexp AND notexp
        var andExpressionType = andexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(andExpressionType);
        var endOfComp = label();
        emit("cmp qword [rsp], 1");
        emit("jne " + endOfComp);
        //if it was False then we dont need to evaluate the rest
        emit("add rsp,8"); //discard left result (0)
        var andExpressionType2 = andexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(andExpressionType2);
        emit(endOfComp + ":");
        return VarType.INTEGER;
    }
}
function notexpNodeCode(n) {
    //notexp ? NOT notexp | rel
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length === 1) {
        //rel
        return relNodeCode(n.children[0]);
    }
    else {
        //NOT notexp
        var notType = notexpNodeCode(n.children[1]);
        convertStackTopToZeroOrOneInteger(notType);
        //just like convertStackTopToZeroOrOneInteger, but replace 0 w/ 1 to invert
        convertStackTopToZeroOrOneInteger(notType, 1);
        return VarType.INTEGER;
    }
}
function negNodeCode(n) {
    //neg -> MINUS neg | factor
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length == 1) {
        //factor
        return factorNodeCode(n.children[0]);
    }
    else {
        //MINUS neg
        negNodeCode(n.children[1]);
        emit("pop rax"); //first operand
        emit("imul rax, -1");
        emit("push rax");
        return VarType.INTEGER;
    }
}
function relNodeCode(n) {
    //rel ? sum RELOP sum | sum
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length === 1)
        //rel -> sum
        return sumNodeCode(n.children[0]);
    else {
        //rel -> sum RELOP sum
        var sum1Type = sumNodeCode(n.children[0]);
        var sum2Type = sumNodeCode(n.children[2]);
        if (sum1Type !== VarType.INTEGER || sum2Type != VarType.INTEGER) {
            throw new Error("Tried to to compare two items that weren't integers: " + sum1Type + " and " + sum2Type + " @line number " + n.token.line);
        }
        emit("pop rax"); //second operand
        //first operand is on stack
        emit("cmp [rsp],rax"); //do the compare
        switch (n.children[1].token.lexeme) {
            case ">=":
                emit("setge al");
                break;
            case "<=":
                emit("setle al");
                break;
            case ">":
                emit("setg  al");
                break;
            case "<":
                emit("setl  al");
                break;
            case "==":
                emit("sete  al");
                break;
            case "!=":
                emit("setne al");
                break;
            default: ICE();
        }
        emit("movzx qword rax, al"); //move with zero extend
        emit("mov [rsp], rax");
        return VarType.INTEGER;
    }
}
function termNodeCode(n) {
    //term -> term MULOP neg | neg
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length == 1) {
        return negNodeCode(n.children[0]);
    }
    else {
        var termType = sumNodeCode(n.children[0]);
        var negType = termNodeCode(n.children[2]);
        if (termType !== negType || termType != VarType.INTEGER) {
            throw new Error("Tried to multiply two items that weren't integers: " + termType + " and " + negType + " @line number " + n.token.line);
        }
        emit("pop rbx"); //second operand
        emit("pop rax"); //first operand
        switch (n.children[1].sym) {
            case "MULOP":
                emit("mul rax, rbx");
                break;
            default:
                ICE();
        }
        emit("push rax");
        return termType;
    }
}
function loopNodeCode(n) {
    //loop -> WHILE LP cond RP braceblock
    if (printProgress) {
        console.log(n);
    }
    var startWhileLabel = label();
    var endWhileLabel = label();
    emit(startWhileLabel + ":");
    exprNodeCode(n.children[2]);
    emit("pop rax");
    emit("cmp rax, 0");
    emit("je " + endWhileLabel);
    //if the comparison is false then we break out of while loop
    braceblockNodeCode(n.children[4]);
    emit("jmp " + startWhileLabel);
    //we need to go back to top of while loop no matter what
    emit(endWhileLabel + ":");
}
function condNodeCode(n) {
    //cond -> IF LP expr RP braceblock |
    //IF LP expr RP braceblock ELSE braceblock
    if (printProgress) {
        console.log(n);
    }
    if (n.children.length === 5) {
        //no 'else'
        exprNodeCode(n.children[2]); //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        var endifLabel = label();
        emit("je " + endifLabel);
        braceblockNodeCode(n.children[4]);
        emit(endifLabel + ":");
    }
    else {
        var endIf = label();
        var endElse = label();
        exprNodeCode(n.children[2]); //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        //if comparison == false, then jump to else block
        emit("je " + endIf);
        //this is the if block
        braceblockNodeCode(n.children[4]);
        emit("jmp " + endElse);
        emit(endIf + ":");
        //this is the else block
        braceblockNodeCode(n.children[6]);
        emit(endElse + ":");
    }
}
function label() {
    var s = "lbl" + labelCounter;
    labelCounter++;
    return s;
}
//# sourceMappingURL=assembleTheAssembly.js.map