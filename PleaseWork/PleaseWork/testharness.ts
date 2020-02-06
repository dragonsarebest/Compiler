
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
        let expected: any = tests[i]["nullable"];
        let input: string = tests[i]["input"];

        let G = new Grammar(input);
        let nullable : any = G.getNullable();
        if (!setsAreSame(nullable, expected)) {
            console.log("nullable: ", nullable);
            console.log("expected: ", expected);
            
            console.log("Test "+name+" failed");
            ++numFailed;
        } 
        else
            ++numPassed;
    }
    console.log(numPassed+" tests OK"+"      "+numFailed+" tests failed" );
    return numFailed==0;
}

function setsAreSame( s1: any, s2: any ){
    let L1 : string[] = [];
    let L2 : string[] = [];
    
    s1.forEach( (x:string) => {
        L1.push(x);
    });
    s2.forEach( (x:string) => {
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
