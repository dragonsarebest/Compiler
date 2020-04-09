"use strict";

declare var require:any;
let fs = require("fs");
import {parse} from "./parser";

class Test{
    name: string;
    grammar: string;
    input: string;
    expectedTree: any;
}

function main(){
    
    let tests : Test[] = JSON.parse( fs.readFileSync("tests.txt", "utf8" ) );
    tests.every( (t:Test) => {
        console.log(t.name);
        try{
            let root = parse( t.grammar, t.input );
            if( t.expectedTree === undefined ){
                console.log("Did not signal error on "+t.name);
                return false;
            }
            fs.writeFileSync( t.name+".tree.dot", root );
        } catch( e ){
            if (t.expectedTree !== undefined) {
                console.log(e);
                console.log("Signaled error on "+t.name);
                return false;
            }
        }
        return true;
    });
}


main()
