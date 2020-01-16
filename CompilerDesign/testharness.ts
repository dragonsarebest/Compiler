
declare var require:any;
let fs = require("fs");
import {Grammar} from "./Grammar";

function main(){
    
    let data:string = fs.readFileSync("tests.txt","utf8");
    let tests: any = JSON.parse(data);
    
    for(let i=0;i<tests.length;++i){
        
        let name: string = tests[i]["name"];
        let ok: any = tests[i]["ok"];
        let grammar: string = tests[i]["grammar"];
        
        let accepted=false;
        try{
            let G = new Grammar( grammar );
            accepted = true;
        } catch(e){
        }

        if(ok){
            if( !accepted ){
                console.log("Rejected valid grammar "+name);
                return;
            }
        } else {
            if( accepted ){
                console.log("Accepted invalid grammar "+name);
                return;
            }
        }
    }
    console.log("All tests OK");
    return true;
}
 
main();
