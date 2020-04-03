"use strict";

declare var require:any;
let fs = require("fs");
import {makeTable} from "./LR";

class Test{
    name: string;
    grammar: string;
    expectedReturn: number;
    expectedTable: any;
}

function main(){
    
    let tests : Test[] = JSON.parse( fs.readFileSync("tests.txt", "utf8" ) );
    tests.forEach( (t:Test) => {
        console.log(t.name);
        let tpl : [Map<string,any>[], number];
        tpl = makeTable( t.grammar );
        let txt = outputTable(tpl[0]);
        fs.writeFileSync( t.name+".table.txt", txt );
        if( tpl[1] !== t.expectedReturn ) {
            console.log("Expected return of "+t.expectedReturn+"but got",tpl[1]);
            return;
        }
    });
}

function outputTable(T: Map<string,any>[] ){
    let L:string[] = [];
    T.forEach( ( row : Map<string,any>, idx: number ) => {
        L.push("Table row "+idx);
        let keys : string[] = [];
        for(let key of row.keys() ){
            keys.push(key);
        }
        keys.sort();
        keys.forEach( (key: string) => {
            let A: any = row.get(key);
            let tmp: string;
            if( A.action === "s" )
                tmp = "shift and go to "+A.num;
            else
                tmp = "pop "+A.num+" and reduce to "+A.lhs;
            L.push("    On "+key+", "+tmp);
        });
    });
    return L.join("\n");
}


main()
