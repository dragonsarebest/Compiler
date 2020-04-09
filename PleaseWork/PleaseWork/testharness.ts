




//to start at a given test number, change this
let startAt=1;

//to stop early, change this
let endAt = 99999;

//set this to true to get more status messages
const VERBOSE=false;



const asmfile = "xyz.asm";
const objfile = "xyz.o";
const exefile = "xyz.exe";


class ReturnStatus {
    msg: string;
    constructor(x: string){
        this.msg=x;
    }
    toString(){
        return this.msg;
    }
}

const NEVER_RETURN = new ReturnStatus("No return");
const DONT_CARE = new ReturnStatus("Don't care");


declare var module:any;
declare var process:any;
declare var require:any;
let fs = require("fs");
let subprocess = require("child_process");
let path = require("path");

import {assembleAsync,linkAsync,assemble,link,quitAsync} from "./exetools";
import {parse} from "./parser";

function unlink(s:string){
    try{
        fs.unlinkSync(s);
    } catch(e){
    }
}

function fmt(i:number){
    let ii: string;
    if( i < 10 )
        ii = "   "+i;
    else if( i < 100 )
        ii = "  "+i;
    else if( i < 1000 )
        ii = " "+i;
    else
        ii = ""+i;
    return ii;
}
//like the Unix (tm) nl utility: Number Lines
function nl(x: string){
    x = x.replace( /\r\n/g, "\n");
    let tmp = x.split("\n");
    for(let i=1;i<=tmp.length;++i){
        let txt = /(.*?)\s*$/.exec(tmp[i-1])[1];
        console.log(fmt(i)+" | "+txt);
    }
}

function access( path: string ){
    try{
        fs.accessSync(path);
        return true;
    } catch(e){
        return false;
    }
}



function codepointToString(codepoint: number){
    //http://crocodillon.com/blog/parsing-emoji-unicode-in-javascript
    let offset = codepoint - 0x10000;
    let offsethi = (offset>>10)+0xd800;
    let offsetlo = 0xdc00 + (offset & 0x3ff);
    let sepchar = String.fromCharCode(offsethi) + String.fromCharCode(offsetlo)+" ";
    //variant selector: monochrome: https://stackoverflow.com/questions/32915485/how-to-prevent-unicode-characters-from-rendering-as-emoji-in-html-from-javascrip
    //sepchar += "\ufe0e";
    return sepchar;
}

//newline symbol
const NEWLINE = "\u23ce";
let SEP="-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=";

let badEmoji = "";
let goodEmoji = "";

if( process.platform === "linux" ){
    //too bad unicode doesn't work on Windows...
    badEmoji = codepointToString(0x1f630); // 0x1f644 0x1f9d0 0x1f92a 
    goodEmoji = codepointToString(0x1f601);
} else {
    badEmoji = ":-(";
    goodEmoji = ":-)";
}


let numCases: number[] = [];
let numOK: number[] = [];
let numBad: number[] = [];
let groupsThatCannotContinue: boolean[] = [];

//list of test cases, sorted by bonus number
//within a bonus number, cases appear in the order
//they were encountered in the input file
let workqueue: any[] = [];

//next item to take from the workqueue
let nextItemIndex: number = 0;

function good(group:number, counter: number){
    ++numOK[group];
    let txt = (group===0)?"Test":"Bonus";
    console.log(counter+": "+txt+" OK");
    scheduleNextRun(false);
}
function bad(group:number, counter: number){
    ++numBad[group];
    groupsThatCannotContinue[group]=true;
    let txt = (group===0)?"Test":"Bonus";
    console.log(counter+": "+txt+" failed");
    if( group === 0 ){
        scheduleNextRun(true);
    } else {
        scheduleNextRun(false);
    }
}
function skip(counter: number, quiet: boolean){
    if(!quiet)
        console.log(counter+": Test skipped");
    scheduleNextRun(false);
}

function scheduleNextRun(giveUp: boolean){
    if( !giveUp && nextItemIndex < workqueue.length ){
        setTimeout( runOneTestcase, 0 );
    } else {
        printSummary();
        quitAsync();
    }
}

function ITE(msg?: string){
    console.log("Internal test error: "+msg);
    quitAsync();
}

 
function printSummary(){
    for(let i=0;i<numCases.length;++i){
        if( numCases[i] === undefined )
            continue;
            
        //~ console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        //~ console.log("@                          @");
        //~ console.log("@     GROUP "+i+"               @");
        //~ console.log("@                          @");
        //~ console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        
            
        let s1="", s2="", s3="";
        
        if( i === 0 ){
            s1="Total non-bonus tests:     ";
            s2="Total non-bonus tests OK:  ";
            s3="Total non-bonus tests bad: "
        } else {
            s1="Bonus group "+i+": Tests:      ";
            s2="Bonus group "+i+": OK:         ";
            s3="Bonus group "+i+": Bad:        ";
        }
        process.stderr.write(s1+" "+numCases[i]+"\n");
        process.stderr.write(s2+" "+numOK[i]+"   "+ ( (numOK[i]==numCases[i])?goodEmoji:badEmoji)+"\n" );
        process.stderr.write(s3+" "+numBad[i]+"\n");
    }
}

function runOneTestcase(){
        
    let testcase = workqueue[nextItemIndex++];
    let testcaseNumber = nextItemIndex; //after it's incremented, so first test is 1
    
    if( groupsThatCannotContinue[ testcase.bonus ] ){
        skip(testcaseNumber,true);
        return;
    }
    
    if( testcaseNumber < startAt ){
        skip(testcaseNumber,true);
        return;
    }

    console.log(SEP);
    console.log("Test "+nextItemIndex+" of "+workqueue.length);

    if( testcaseNumber > endAt ){
        skip(testcaseNumber,false);
        return;
    }
    
     
    unlink(asmfile);
    unlink(objfile);
    unlink(exefile);
    
    let input : string = testcase["code"];
    let syntaxOK: boolean = testcase["syntaxOK"];
    let expectedReturn : any = testcase["returns"];
    let expectedStdout : string = testcase["output"];
    let outputfiles: [string,string][] = testcase["outputfiles"];
    let stdin : string = testcase["input"]
    let group: number = testcase["bonus"];
    
    if( syntaxOK === undefined )
        syntaxOK = true;
        
    if( expectedReturn === undefined )
        expectedReturn = DONT_CARE;
    
    if( expectedReturn === null )
        expectedReturn = NEVER_RETURN;
        
    if( expectedStdout === undefined )
        expectedStdout = "";
        
    if( outputfiles === undefined )
        outputfiles = [];
        
    if( group === undefined )
        group = 0;
    
    if( stdin === undefined )
        stdin = "";
        
    let actualReturn: any;
    let actualStdout = "";
    let asm: string;

    if(!group)
        group=0;
        
    if( !syntaxOK && expectedReturn !== NEVER_RETURN && expectedReturn !== DONT_CARE ){
        ITE("syntaxOK=false but expectedReturn acts like it returns");
        return;
    }
        
        
    let printStatus = () => {
        console.log("------------------------------");
        console.log("Input:");
        nl(input);
        console.log("------------------------------");
        console.log("Assembly code:");
        try{
            let asmdata = fs.readFileSync(asmfile,"utf8");
            nl(asmdata);
        } catch(e){
            console.log("(no assembly output file)");
        }
        console.log("------------------------------");
        console.log("Actual return code:  ",actualReturn);
        console.log("Expected return code:",expectedReturn);
        console.log("------------------------------");
        let exp: string;
        if( expectedStdout !== null )
            exp = expectedStdout.replace(/\n/g,NEWLINE);
        else
            exp = "<don't care>";
        console.log("Expected stdout: "+exp);
        console.log("Actual stdout:   "+actualStdout.replace(/\n/g,NEWLINE));
        console.log("------------------------------");
        outputfiles.forEach( ( spec: [string,string] ) => {
            let fname = spec[0];
            let econtents = spec[1];
            console.log("Output file: ",fname);
            console.log("Expected contents: "+econtents.replace(/\n/g,NEWLINE));
            if( !access(fname) )
                console.log("Actual contents:   <missing>");
            else{
                let acontents = fs.readFileSync( fname , "utf8" );
                console.log("Actual contents:   "+acontents.replace(/\n/g,NEWLINE));
            }
            console.log("------------------------------");
        });
    }
    
    
    
     
    function reportError(e: any){
        console.log(e);
        printStatus();
        bad(group,testcaseNumber);
        return;
    }
    
    
    try{
        asm = parse( input );
        
        if( !syntaxOK ){
            console.log("Accepted invalid input");
            console.log("------------------------------");
            console.log("Input:");
            nl(input);
            console.log("------------------------------");
            bad(group,testcaseNumber);
            return;
        } 
    } catch(e){
        console.log(e.message);
        
        if( !syntaxOK ){
            //OK; we expect this will not compile
            good(group,testcaseNumber);
            return;
        } else {
            //this should have compiled
            console.log(e);
            console.log("------------------------------");
            console.log("Input:");
            nl(input);
            console.log("------------------------------");
            bad(group,testcaseNumber);
            return;
        }
    }
        
    console.log("Parse OK");
    fs.writeFileSync( asmfile, asm );
    assembleAsync( asmfile, objfile, (err: any) => {
        if( err ){
            reportError("Assemble error: "+err);
            return;
        }
        console.log("Assemble OK");
        linkAsync( objfile, exefile, (err: any) => {
            
            if( err ){
                reportError("Link error: "+err);
                return;
            }
            
            console.log("Link OK");
            
            let ex:string = "." + path.sep + exefile;

            let opts: any = { 
                stdio: ["pipe","pipe","inherit"],
                shell: false,
                timeout: 1000,
                input: ( stdin ? stdin : "" )
            };
            
            let rv:any
            try{
                rv = subprocess.spawnSync( ex, [], opts );
            } catch(e){
                rv = {error:e};
            }
            
            if( rv.error ){
                if( rv.error.errno === "ETIMEDOUT" || rv.error.code === "ETIMEDOUT" )
                    actualReturn = NEVER_RETURN;
                else{
                    reportError(rv.error);
                    return;
                }
            } else if( rv.signal ){
                reportError("Program caught signal: "+rv.signal);
                return;
            } else {
                actualReturn = rv.status;
                if( actualReturn === null ){
                    ITE("Internal test error: "+rv);
                    return;
                }
            }

            if( rv.stdout && rv.stdout.length > 0 )
                actualStdout = rv.stdout+"";
            if( actualStdout !== "" )
                console.log(actualStdout);
            
            if( expectedReturn !== DONT_CARE && actualReturn !== expectedReturn ){
                reportError( "Return value mismatch" ) ;
                return;
            }
            
            
            if( expectedStdout === null ){
                //don't care what stdout is
            } else {
                actualStdout = actualStdout.replace( /\r\n/g, "\n");
                let nowIndex = expectedStdout.indexOf("${now}");    
                if( nowIndex !== -1 ){
                    //make sure strings are identical up to point of date
                    for(let i=0;i<nowIndex;++i){
                        if( actualStdout[i] !== expectedStdout[i] ){
                            reportError("Stdout mismatch");
                            return;
                        }
                    }
                    let i = actualStdout.indexOf("\n",nowIndex );
                    if( i === -1 )
                        i = actualStdout.length;
                    let date1 = Date.parse( actualStdout.substring(nowIndex,i) );
                    let actualRest = actualStdout.substring(i);
                    let date2 = Date.now();
                    let delta = Math.abs(date1 - date2)
                    if( delta > 5000 ){
                        reportError("Stdout mismatch: dates: "+date1+" and "+date2);
                        return;
                    }
                    console.log("Note: Dates matched with delta of "+delta+" (now="+new Date()+")");
                    let expectedRest = expectedStdout.substring(nowIndex + "${now}".length );
                    if( actualRest !== expectedRest ){
                        reportError("Stdout mismatch");
                        return;
                    }
                    
                } else {
                    if( actualStdout !== expectedStdout ){
                        reportError( "Stdout mismatch" );
                        return;
                    }
                }
            }
            
            if( outputfiles ){
                outputfiles.forEach( ( spec: [string,string] ) => {
                    let fname = spec[0];
                    let econtents = spec[1];
                    if( !access(fname) ){
                        reportError("Expected to find output file "+fname+" but did not");
                        return;
                    }
                    let acontents = fs.readFileSync( fname , "utf8" );
                    if( econtents !== acontents ){
                        reportError("File mismatch");
                        return;
                    }
                });
            }
        
            if(VERBOSE)
                printStatus();
            good(group,testcaseNumber);
            return;
        });
    });
}



function main(){
    let inputfile = "inputs.json";
    let indata = fs.readFileSync(inputfile,"utf8") ;
    indata = indata.replace(/\r\n/g,"\n");
    indata = indata.replace( /''((.|\n)*?)''/g, (x:string) => {
        x=x.substr(3);
        x=x.substr(0,x.length-3);
        x=x.replace(/\\/g,"\\\\");
        x=x.replace(/\n/g,"\\n")
        x=x.replace(/"/g,'\\"');
        x='"'+x+'"';
        return x;
    });
    
    //quick syntax check on 'indata'
    try{
        JSON.parse(indata);
    } catch(e){
        let tmp = indata.split("\n");
        let total=0;
        for(let i=0;i<tmp.length;++i){
            console.log(fmt(total)+" - "+tmp[i]);
            total += tmp[i].length+1;
        }
        throw(e)
    }
    
    //now parse it for real
    let inputs = JSON.parse( indata );
    let cases: any[] = [];
    
    inputs.forEach( (testcase: any) => {
        let bonus: number = testcase["bonus"];
        if(!bonus)
            bonus=0;    //not a bonus
        testcase["bonus"] = bonus;  //convert null or undefined or false to zero

        if( cases[bonus] === undefined ){
            cases[bonus] = [];
            numCases[bonus] = 0;
            numOK[bonus] = 0;
            numBad[bonus] = 0;
        }
        cases[bonus].push(testcase);
        numCases[bonus]++;
    });

    for(let i=0;i<cases.length;++i){
        if( cases[i] ){
            cases[i].forEach( (testcase: any) => {
                workqueue.push(testcase);
            });
        }
    }
    
    runOneTestcase();
    
}

if( require.main === module ){
    if( process.argv.length === 4 ){
        startAt = parseInt(process.argv[2],10);
        endAt = parseInt(process.argv[3],10);
        console.log("Starting at",startAt,"and ending at",endAt);
        main();
    } else if( process.argv.length === 3 ){
        let input = fs.readFileSync(process.argv[2]);
        let asm = parse(input);
        fs.writeFileSync( asmfile, asm );
        assemble( asmfile, objfile );
        link( objfile, exefile );
        console.log("Executable is in",exefile);
    } else{
        main();
    }
}
