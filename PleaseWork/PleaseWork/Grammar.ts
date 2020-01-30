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
    terminals = []
    terminalProductions = []
    nonterminals = []

    constructor(input: string)
    {
        let lines = input.split("\n");
       
        let expression = new RegExp("([^ ]*)( -> )(.*)", "i");

        let setOfTerminals: Set<string> = new Set();
        let setOfNon: Set<string> = new Set();
        let graph: Set<string> = new Set();
        let startNode = new NodeType("");
        let startNodeName = "";

        let switchToNon = false;
        let firstNode = false;

        //this.terminals.push(new terminal("WHITESPACE", new RegExp("\\s+", "gy")));

        //console.log("--------------------\nRAW INPUT: \n", input);

        lines.forEach(element => {
            let match = expression.exec(element);
            if (match) {
                let left = match[1].trim();
                let regex: RegExp;

                if (!switchToNon) {

                    try {
                        regex = new RegExp(match[3], "gy");
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
                }
                else {
                    let right = match[3].trim();

                    if (setOfNon.has(left)) {
                        //throw new Error("Lefthandside has been defined more than once!");
                    }
                    else {
                        if (setOfTerminals.has(left))
                        {
                            throw new Error("Lefthandside has been defined as a terminal and a production rule!");
                        }
                        else
                        {
                            setOfNon.add(left);
                        }
                    }

                    if (!firstNode)
                    {
                        firstNode = true;
                        startNodeName = left;
                    }
                    this.nonterminals.push(new nonterminal(left, right));
                }

            }
            else {
                if (!switchToNon)
                {
                    switchToNon = true;
                }
                else
                {
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
        });
        this.terminalProductions.forEach(element => {
            globalNodes.set(element.label, element);
        });

        this.nonterminals.forEach(element => {
            let temp = globalNodes.get(element.sym);

            let tempRight = [];
            let rightHandSide = element.eq.split("|");
            rightHandSide.forEach(right => {
                let temp = right.split(" ");
                temp.forEach(element => {
                    element = element.trim();
                    if (element.length > 0)
                        tempRight.push(element);
                });
            });

            rightHandSide = tempRight;

            rightHandSide.forEach(right => {

                let temp2 = globalNodes.get(right);
                if (temp2 == undefined) {
                    //console.log("Error:", right);
                    throw new Error("Referencing a undefined production!");
                }

                temp.neighbors.push(temp2);
                globalNodes.set(element.sym, temp);
            });
        });

        startNode = globalNodes.get(startNodeName);

        this.depthFirstSearch(startNode, graph);

        let totality = Array.from(globalNodes.keys());
        /*
        totality.forEach(element => {
            if (!graph.has(element))
            {
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
        */

        console.log("GRAMMAR");
        console.log(this.terminals);
        console.log(this.nonterminals);
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


}