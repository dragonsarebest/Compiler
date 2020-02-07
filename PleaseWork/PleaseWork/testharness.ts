
declare var require:any;
let fs = require("fs");
import {Grammar} from "./Grammar";

function main(){
    let data:string = fs.readFileSync("tests.txt","utf8");
    let tests: any = JSON.parse(data);
    let numPassed=0;
    let numFailed=0;
    
    for(let i=0;i<tests.length;++i){
        
        let name: string = tests[i]["name"];
        let expected: { [key:string] : string[]} = tests[i]["first"];
        let input: string = tests[i]["input"];

        let G = new Grammar(input);
        
        let first : Map<string,Set<string>> = G.getFirst();
        if( !dictionariesAreSame( expected, first ) ){
            console.log("Test "+name+" failed");
            ++numFailed;
        } 
        else
            ++numPassed;
    }
    console.log(numPassed+" tests OK"+"      "+numFailed+" tests failed" );
    return numFailed==0;
}

function dictionariesAreSame( s1: { [key:string] : string[]}, s2: Map<string,Set<string>> ){
    let M1: Map<string,Set<string>> = toMap(s1);
    let M2 = s2;
    
    let k1: string[] = [];
    let k2: string[] = [];
    for(let k of M1.keys() )
        k1.push(k);
    for(let k of M2.keys() )
        k2.push(k);
    k1.sort();
    k2.sort();
    if( !listsEqual(k1,k2) ){
        console.log("Lists not equal:",k1,k2);
        return false;
    }
    for(let k of k1){
        if( !listsEqual( M1.get(k), M2.get(k) ) ){
            console.log("Lists not equal:",M1.get(k), M2.get(k)  );
            return false;
        }
    }
    return true;
}

function toMap( s: { [key:string] : string[]} ) {
    let r : Map<string,Set<string>> = new Map();
    for(let k in s ){
        r.set(k,new Set());
        s[k].forEach( (x:string) => {
            r.get(k).add(x);
        });
    }
    return r;
}
    
function listsEqual(L1a: any, L2a: any )
{
    let L1: string[] = [];
    let L2: string[] = [];
    L1a.forEach( (x:string) => {
        L1.push(x);
    });
    L2a.forEach( (x:string) => {
        L2.push(x);
    });
    
    L1.sort();
    L2.sort();
    if( L1.length !== L2.length )
        return false;
    for(let i=0;i<L1.length;++i){
        if( L1[i] !== L2[i] )
            return false;
    }
    return true;
}
 
    


main();
