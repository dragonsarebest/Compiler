import { TreeNode } from "./parser";

export let asmCode: string[];
let labelCounter = 0;

let printProgress = false;
let printOther = true;

export function makeAsm(root: TreeNode) {
    asmCode = [];
    labelCounter = 0;
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    programNodeCode(root);
    emit("ret");
    emit("section .data");
    return asmCode.join("\n");
}

function ICE() {
    //internal compiler error
    let errorMsg: string = "\tInternal Compiler Error!";
    console.log(errorMsg);
    throw new Error(errorMsg);
}

enum VarType {
    INTEGER,
    FLOAT
}

function emit(instr: string) {
    asmCode.push(instr);
}

function programNodeCode(n: TreeNode) {
    //program -> braceblock
    //if (printProgress) {
    //    console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    //}
    if (n.sym != "program")
        ICE();
    braceblockNodeCode(n.children[0]);
}

function braceblockNodeCode(n: TreeNode) {
    //braceblock -> LBR stmts RBR
    //if (printProgress) {
    //    console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    //}
    stmtsNodeCode(n.children[1]);
}

function stmtsNodeCode(n: TreeNode) {
    //stmts -> stmt stmts | lambda
    //if (printProgress) {
    //    console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    //}
    if (n.children.length == 0)
        return;
    stmtNodeCode(n.children[0]);
    stmtsNodeCode(n.children[1]);
}

function stmtNodeCode(n: TreeNode) {
    //stmt -> cond | loop | return-stmt SEMI
    //if (printProgress) {
    //    console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    //}
    let c = n.children[0];
    switch (c.sym) {
        case "cond":
            condNodeCode(c); break;
        case "loop":
            loopNodeCode(c); break;
        case "return-stmt":
            returnstmtNodeCode(c); break;
        default:
            ICE();
    }
}

function returnstmtNodeCode(n: TreeNode) {
    //return-stmt -> RETURN expr
    //if (printProgress) {
    //    console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    //}
    exprNodeCode(n.children[1]);
    emit("pop rax");
    emit("ret");
}

function factorNodeCode(n: TreeNode): VarType {
    //factor -> NUM | LP expr RP
    if (printProgress) {
        console.log("FACTOR");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    let child = n.children[0];

    //console.log("FACTOR");
    //console.log(n);
    //console.log(n.children[0]);
    //console.log(n.children[0].sym);
    if (child == undefined) {
        console.log("undefined child in factor");
    }

    switch (child.sym) {
        case "NUM":
            let v = parseInt(child.token.lexeme, 10);
            if (printOther) {
                console.log("pushing ", v, " to memory");
            }
            emit(`push qword ${v}`)
            return VarType.INTEGER;
        case "FPNUM":
            let v2 = parseFloat(child.token.lexeme);
            if (printOther) {
                console.log("pushing ", v2, " to memory");
            }
            emit(`push qword ${v2}`)
            return VarType.FLOAT;
        case "LP":
            return exprNodeCode(n.children[1]);
        default:
            ICE();
            return undefined;
    }
}


function sumNodeCode(n: TreeNode): VarType {
    //sum -> sum PLUS term | sum MINUS term | term
    if (printProgress) {
        console.log("SUM");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length === 1) {
        //sum -> term
        //console.log("SUM");
        //console.log(n);
        return termNodeCode(n.children[0]);
    }
    else {
        //console.log("SUM 2");
        //console.log(n);
        //console.log("\t\tsummation first");
        let sumType = sumNodeCode(n.children[0]);
        //console.log("\t\ttermintion first");
        let termType = termNodeCode(n.children[2]);
        if (sumType != termType || termType != VarType.INTEGER && termType != VarType.FLOAT) {
            throw new Error("Tried to add or subtract two items of differnt types: " + sumType + " and " + termType + " @line number " + n.token.line);
        }
        emit("pop rbx");    //second operand
        emit("pop rax");    //first operand
        switch (n.children[1].sym) {
            case "PLUS":
                if (printOther) {
                    console.log("adding");
                }
                if (termType == VarType.INTEGER) {
                    emit("add rax, rbx");
                }
                else if (termType == VarType.FLOAT) {
                    emit("fadd rax, rbx");
                }
                
                break;
            case "MINUS":
                if (printOther) {
                    console.log("subtracting");
                }
                if (termType == VarType.INTEGER) {
                    emit("sub rax, rbx");
                }
                else if (termType == VarType.FLOAT) {
                    emit("fsub rax, rbx");
                }
                break;
            default:
                ICE();
        }
        emit("push rax");
        return sumType;
    }
}

function exprNodeCode(n: TreeNode): VarType {
    if (printProgress) {
        console.log("EXPR");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    return orexpNodeCode(n.children[0]);
}

function convertStackTopToZeroOrOneInteger(type: VarType, invert: number = 0) {
    if (printOther) {
        console.log("CONVERSION");
        console.log(invert);
    }
    if (type == VarType.INTEGER) {
        emit("cmp qword [rsp], " + invert);
        emit("setne al");
        emit("movzx rax, al");
        emit("mov [rsp], rax");
    } else {
        throw new Error("Tried to convert a non-integer into a truthy/falsy value: " + type);
    }
}

function orexpNodeCode(n: TreeNode): VarType {
    //orexp ? orexp OR andexp | andexp
    if (printProgress) {
        console.log("OR");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length === 1) {
        //andexp
        return andexpNodeCode(n.children[0]);
    } else {
        //orexp OR andexp
        //if (printOther) {
        //    console.log("OR");
        //    console.log(n);
        //}
        let orexpType = orexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(orexpType);
        //is the first part of the or expressin true
        let endOfComp = label();
        emit("cmp qword [rsp], 0");
        emit(`jne ${endOfComp}`);
        //if it was true then we dont need to evaluate the rest
        emit("add rsp,8");      //discard left result (0)
        let andexpType = andexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(andexpType);
        emit(`${endOfComp}:`);
        return VarType.INTEGER;   //always integer, even if float operands
    }
}

function andexpNodeCode(n: TreeNode): VarType {
    //andexp ? andexp AND notexp | notexp
    if (printProgress) {
        console.log("AND");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length === 1) {
        //notexp
        return notexpNodeCode(n.children[0]);
    } else {
        //andexp AND notexp
        //if (printOther) {
        //    console.log("AND");
        //    console.log(n);
        //}
        let andExpressionType = andexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(andExpressionType);
        let endOfComp = label();
        emit("cmp qword [rsp], 1");
        emit(`jne ${endOfComp}`);
        //if it was False then we dont need to evaluate the rest
        emit("add rsp,8");      //discard left result (0)
        let andExpressionType2 = notexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(andExpressionType2);
        emit(`${endOfComp}:`);
        return VarType.INTEGER;
    }
}

function notexpNodeCode(n: TreeNode): VarType {
    //notexp ? NOT notexp | rel
    if (printProgress) {
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length === 1) {
        //rel
        return relNodeCode(n.children[0]);
    } else {
        //NOT notexp
        let notType = notexpNodeCode(n.children[1]);
        convertStackTopToZeroOrOneInteger(notType);
        //just like convertStackTopToZeroOrOneInteger, but replace 0 w/ 1 to invert
        convertStackTopToZeroOrOneInteger(notType, 1);
        return VarType.INTEGER;
    }
    
}

function negNodeCode(n: TreeNode): VarType {
    //neg -> MINUS neg | factor
    if (printProgress) {
        console.log("NEGATION");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length == 1) {
        //factor
        //console.log("NEGATE");
        //console.log(n);
        return factorNodeCode(n.children[0]);
    }
    else {
        //MINUS neg
        if (printOther) {
            console.log("negating");
        }
        negNodeCode(n.children[1]);
        emit("pop rax");    //first operand
        emit("imul rax, -1");
        emit("push rax");
        return VarType.INTEGER;
    }
}

function relNodeCode(n: TreeNode): VarType {
    //rel -> sum RELOP sum | sum
    if (printProgress) {
        console.log("RELATION");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length === 1) {
        //rel -> sum
        //console.log("RELATION");
        //console.log(n);
        return sumNodeCode(n.children[0]);
    }
    else {
        //rel -> sum RELOP sum
        //console.log("RELATION 2");
        //console.log(n);
        //console.log(n.children);
        let sum1Type = sumNodeCode(n.children[0]);
        let sum2Type = sumNodeCode(n.children[2]);
        if (sum1Type !== VarType.INTEGER || sum2Type != VarType.INTEGER && sum2Type != VarType.FLOAT) {
            throw new Error("Tried to to compare two items that weren't integers: " + sum1Type + " and " + sum2Type + " @line number " + n.token.line);
        }
        emit("pop rax");    //second operand
        //first operand is on stack
        emit("cmp [rsp],rax");    //do the compare
        switch (n.children[1].token.lexeme) {
            case ">=": emit("setge al"); break;
            case "<=": emit("setle al"); break;
            case ">": emit("setg  al"); break;
            case "<": emit("setl  al"); break;
            case "==": emit("sete  al"); break;
            case "!=": emit("setne al"); break;
            default: ICE()
        }
        emit("movzx qword rax, al");   //move with zero extend
        emit("mov [rsp], rax");
        return VarType.INTEGER;
    }
}


function termNodeCode(n: TreeNode): VarType {
    //term -> term MULOP neg | neg
    if (printProgress) {
        console.log("TERM");
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length == 1) {
        //neg
        //console.log("TERM");
        //console.log(n);
        return negNodeCode(n.children[0]);
    }
    else {
        //term MULOP neg
        let termType = termNodeCode(n.children[0]);
        let negType = negNodeCode(n.children[2]);
        if (termType !== negType || termType != VarType.INTEGER && termType != VarType.FLOAT) {
            throw new Error("Tried to multiply/divide two items that weren't integers: " + termType + " and " + negType + " @line number " + n.token.line);
        }
        emit("pop rbx");    //second operand
        emit("pop rax");    //first operand
        switch (n.children[1].sym) {
            case "MULOP":
                if (n.children[1].token.lexeme == "/") {
                    if (printOther) {
                        console.log("dividing");
                        //console.log(n.children[0].children[0].children[0]);
                        //console.log(n.children[2].children[0].children[0]);
                    }
                    emit("mov rdx, 0");
                    emit("idiv rbx");
                }
                else if (n.children[1].token.lexeme == "*") {
                    if (printOther) {
                        console.log("multiplying");
                    }
                    emit("imul rbx");
                }
                else  {
                    //(n.children[1].token.lexeme == "%")
                    if (printOther) {
                        console.log("remainder");
                    }
                    emit("mov rdx, 0");
                    emit("idiv rbx");
                    emit("mov rax, rdx");
                    //emit("move rax, rdx ;quotient => rax, remainder => rdx");
                }
                
                break;
            default:
                ICE();
        }
        emit("push rax");
        return termType;
    }
}


function loopNodeCode(n: TreeNode) {
    //loop -> WHILE LP cond RP braceblock
    if (printProgress) {
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    var startWhileLabel = label();
    var endWhileLabel = label();

    emit(`${startWhileLabel}:`);
    exprNodeCode(n.children[2]);
    emit("pop rax");
    emit("cmp rax, 0");
    emit(`je ${endWhileLabel}`);
    //if the comparison is false then we break out of while loop
    braceblockNodeCode(n.children[4]);
    emit(`jmp ${startWhileLabel}`);
    //we need to go back to top of while loop no matter what
    emit(`${endWhileLabel}:`);
}

function condNodeCode(n: TreeNode) {
    //cond -> IF LP expr RP braceblock |
    //IF LP expr RP braceblock ELSE braceblock
    if (printProgress) {
        console.log(n); n.children.forEach((child) => { console.log("\n", child);});
    }
    if (n.children.length === 5) {
        //no 'else'
        exprNodeCode(n.children[2]);    //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        var endifLabel = label();
        emit(`je ${endifLabel}`);
        braceblockNodeCode(n.children[4]);
        emit(`${endifLabel}:`);
    } else {

        var endIf = label();
        var endElse = label();

        exprNodeCode(n.children[2]);    //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        //if comparison == false, then jump to else block
        emit(`je ${endIf}`);
        //this is the if block
        braceblockNodeCode(n.children[4]);
        emit(`jmp ${endElse}`);
        emit(`${endIf}:`);

        //this is the else block
        braceblockNodeCode(n.children[6]);
        emit(`${endElse}:`);
    }
}

function label() {
    let s = "lbl" + labelCounter;
    labelCounter++;
    return s;
}