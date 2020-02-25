const CHECK_GRAMMAR_ERRORS: boolean = false;

class NodeType
{
    label: string;
    neighbors: NodeType[];
    constructor(L: string)
    {
        this.label = L;
        this.neighbors = []
    }
}

class terminal
{
    sym: string;
    rex: RegExp;

    constructor(sym: string, rex: RegExp)
    {
        this.sym = sym;
        this.rex = rex;
    }
}

class nonterminal {
    sym: string;
    eq: string;

    constructor(sym: string, eq: string) {
        this.sym = sym;
        this.eq = eq;
    }
}

export class Grammar
{
    terminals: Array<terminal> = []
    //list of terminal class
    terminalProductions: Array<NodeType> = []
    // is typeNode list

    nonTerminalProductions: Map<string, Set<string[]>> = new Map<string, Set<string[]>>();
    //contains nonterminal lhs and rhs as a map
    nonterminals: Array<nonterminal> = []
    //list of nonterminal class

    first: Map<string, Set<string>> = new Map();
    nullableSet: Set<string> = new Set<string>();

    constructor(input: string) {
        let lines = input.split("\n");

        let expression = new RegExp("([^ ]*)( -> )(.*)", "i");

        let setOfTerminals: Set<string> = new Set();
        let setOfNon: Set<string> = new Set();
        let graph: Set<string> = new Set();
        let startNode = new NodeType("");
        let startNodeName = "";

        let switchToNon = false;
        let firstNode = false;

        this.terminals.push(new terminal("WHITESPACE", new RegExp("\\s+", "gy")));

        console.log("--------------------\nRAW INPUT:\n", input);

        lines.forEach(element => {
            let match = expression.exec(element);
            if (match) {
                let left = match[1].trim();
                let regex: RegExp;

                if (!switchToNon) {

                    try {
                        regex = new RegExp(match[3].trim(), "gy");
                    }
                    catch
                    {
                        throw new Error("Righthandside is not a propperly formatted regex expression!");
                    }

                    if (setOfTerminals.has(left)) {
                        throw new Error("Lefthandside has been defined more than once!");
                    }
                    else {
                        setOfTerminals.add(left);
                    }

                    this.terminals.push(new terminal(left, regex))

                    let node = new NodeType(left);
                    let right = match[3].trim();
                    this.terminalProductions.push(node);
                    this.nonTerminalProductions.set(left, new Set<string[]>());
                    
                }
                else {
                    let right = match[3].trim();

                    if (setOfNon.has(left)) {
                        ;
                    }
                    else {
                        if (setOfTerminals.has(left)) {
                            throw new Error("Lefthandside has been defined as a terminal and a production rule!");
                        }
                        else {
                            setOfNon.add(left);
                        }
                    }
                    if (!firstNode) {
                        firstNode = true;
                        startNodeName = left;
                    }
                    this.nonterminals.push(new nonterminal(left, right));
                    
                }

            }
            else {
                if (!switchToNon) {
                    switchToNon = true;
                }
                else {
                    if (element.length > 0) {
                        throw new Error("Grammar is impropperly formatted!");
                    }
                }
            }
        });

        let globalNodes = new Map();
        this.nonterminals.forEach(element => {
            let tempNode = new NodeType(element.sym);
            globalNodes.set(tempNode.label, tempNode);
            if (element.sym != undefined && element.sym != 'undefined')
                this.first.set(element.sym, new Set<string>());   
        });
        this.terminalProductions.forEach(element => {
            globalNodes.set(element.label, element);
            if (element.label != undefined && element.label != 'undefined') {
                let tempSetforOneUse = new Set<string>();
                tempSetforOneUse.add(element.label);
                this.first.set(element.label, tempSetforOneUse);
            }
        });

        this.nonterminals.forEach(element => {
            let temp = globalNodes.get(element.sym);
            //let nonterminalSet = new Set<string[]>();

            //set up first with empty sets
            this.first.set(element.sym, new Set<string>());

            let tempRight = new Array();
            let rightHandSide = element.eq.split("|");
            rightHandSide.forEach(right => {
                let temp = right.split(" ");
                let tempList = new Array();
                temp.forEach(subelement => {
                    subelement = subelement.trim();
                    if (subelement.length > 0) {
                        tempRight.push(subelement);
                        if (subelement == "lambda")
                            subelement = "";
                        tempList.push(subelement);
                    }
                });
                let tempSet = this.nonTerminalProductions.get(element.sym);
                if (tempSet == undefined)
                    tempSet = new Set<string[]>();
                tempSet.add(tempList);
                this.nonTerminalProductions.set(element.sym, tempSet);
            });
            rightHandSide = tempRight;

            if (CHECK_GRAMMAR_ERRORS) {
                rightHandSide.forEach(right => {

                    let temp2 = globalNodes.get(right);
                    if (temp2 == undefined) {
                        //console.log("Error:", right);
                        throw new Error("Referencing a undefined production!");
                    }

                    temp.neighbors.push(temp2);
                    globalNodes.set(element.sym, temp);
                });
            }
        });

        //console.log(this.nonTerminalProductions);

        if (CHECK_GRAMMAR_ERRORS) {
            startNode = globalNodes.get(startNodeName);

            this.depthFirstSearch(startNode, graph);

            let totality = Array.from(globalNodes.keys());

            totality.forEach(element => {
                if (!graph.has(element)) {
                    //if there's an item in our terminals / nontermianls that's not in the graph then you cannot
                    //reach it from the start state therefore this grammar is invalid!
                    //console.log("error: ", element);
                    throw new Error("Grammar contains a useless production rule!");
                }
            });

            graph.forEach(element => {
                if (!totality.includes(element)) {
                    //if we have an item in graph that isn't in terminals or nonterminals then we have an undefined symbol
                    //console.log("error: ", element);
                    throw new Error("Grammar contains an undefined symbol!");
                }
            });
        }

        this.nullableSet = this.calculateNullable();
        this.calculateFirst();
    }

    depthFirstSearch(node: NodeType, visited: Set<string>)
    {
        visited.add(node.label);
        node.neighbors.forEach((w: NodeType) => {
            if (!visited.has(w.label)) {
                this.depthFirstSearch(w, visited);
            }
        });
        
    }

    calculateNullable()
    {
        let tempSet = new Set<string>();
        while (true) {
            let change = false;
            this.nonterminals.forEach(symbol => {
                if (!tempSet.has(symbol.sym)) {
                    let count = 0;
                    this.nonTerminalProductions.get(symbol.sym).forEach(production => {
                        let lambdaInHere = true;
                        production.every(sub => {
                            if (sub != "" && !tempSet.has(sub)) {
                                lambdaInHere = false;
                                return false;
                            }
                            return true;
                        });
                        if (lambdaInHere)
                        {
                            //this means that every single subproduction was nullable
                            tempSet.add(symbol.sym);
                            change = true;
                            count++;
                        }
                        
                    });
                    if (count >= this.nonTerminalProductions.get(symbol.sym).size)
                    {
                        if (!tempSet.has(symbol.sym))
                        {
                            //this means that every single production was nullable
                            tempSet.add(symbol.sym);
                            change = true;
                        }
                    }
                }
            });

            if (change == false)
                break;
        }
        return tempSet;
    }

    getNullable()
    {
        return this.nullableSet;
    }

    union(set1: Set<string>, set2: Set<string>)
    {
        if (set2 == undefined && set1 != undefined)
            return set1;
        else if (set1 == undefined && set2 != undefined)
            return set2;
        else if (set1 == undefined && set2 == undefined)
            return undefined;
        let a = Array.from(set1);
        let b = Array.from(set2);
        let c = a.concat(b);
        return new Set(c);
    }

    calculateFirst()
    {
        while (true)
        {
            let change = false;
            this.nonterminals.forEach(nonTerm => {
                //console.log("checking nonterminal: ", nonTerm);
                this.nonTerminalProductions.get(nonTerm.sym).forEach(production => {
                    //console.log("\tchecking production: ", production);
                    production.every(sub => {
                        //console.log("\t\tchecking subproduction: ", sub);
                        let countBefore = this.first.get(nonTerm.sym).size;
                        this.first.set(nonTerm.sym, this.union(this.first.get(nonTerm.sym), this.first.get(sub)));
                        let countAfter = this.first.get(nonTerm.sym).size;
                        if (countBefore != countAfter)
                            change = true;
                        if (this.nullableSet.has(sub))
                            return true;
                        //console.log("\t\t\tfirst non-nullable character: ", sub);
                        return false;
                    });
                });
            });
            if (change == false)
                break;
        }
    }

    getFirst()
    {
        return this.first;
    }


}