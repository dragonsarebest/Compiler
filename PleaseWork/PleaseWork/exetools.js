"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let subprocess = require("child_process");
let fs = require("fs");
//VS2019
//need to install Build Tools for VS 2019 in the VS installer.
//https://stackoverflow.com/questions/55097222/vcvarsall-bat-for-visual-studio-2019
const VSBAT = "c:\\program files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Auxiliary\\Build\\vcvars64.bat";
//vs2017
//const VSSHELL="c:\\program files (x86)\\Microsoft Visual Studio\\2017\\Community\\VC\\Auxiliary\\Build\\vcvars64.bat"
/** Input: Assembly code.
 * Returns: Object file*/
function assemble(asmfile, objfile) {
    let args;
    switch (process.platform) {
        case "linux":
            args = ["-gdwarf", "-f", "elf64"];
            break;
        case "win32":
            args = ["-g", "-f", "win64"];
            break;
        case "darwin":
            args = ["-g", "--prefix", "_", "-f", "macho64"];
            break;
        default:
            throw new Error();
    }
    args.push("-Werror");
    args.push("-o");
    args.push(objfile);
    args.push(asmfile);
    let rv = subprocess.spawnSync("nasm", args, {
        stdio: ["ignore", "inherit", "inherit"],
        shell: false
    });
    if (rv.error && rv.error.errno === "ENOENT") {
        console.log("NASM is not in your PATH. I can't go on.");
        process.exit(1);
    }
    if (rv.status !== 0)
        throw new Error("Subprocess failed");
}
exports.assemble = assemble;
function assembleAsync(asmfile, objfile, callback) {
    try {
        assemble(asmfile, objfile);
        callback(undefined);
    }
    catch (e) {
        callback(e);
    }
}
exports.assembleAsync = assembleAsync;
function access(file) {
    try {
        fs.accessSync(file);
        return true;
    }
    catch (e) {
        return false;
    }
}
function getShell() {
    switch (process.platform) {
        case "linux":
            return ["/bin/sh", ""];
        case "win32":
            return ["cmd", `"${VSBAT}"\ncd "${process.cwd()}"\necho off\n`];
        case "darwin":
            return ["/bin/sh", ""];
        default:
            throw new Error();
    }
}
function getSet() {
    switch (process.platform) {
        case "linux":
        case "darwin":
            return "export";
        case "win32":
            return "set";
        default:
            throw new Error();
    }
}
function getLinker(objfile, exefile) {
    switch (process.platform) {
        case "linux":
            return ["gcc", ["-m64", objfile, "-o", exefile]];
        case "win32":
            //for vs2019:
            //  oldnames.lib has fdopen
            //  msvcrt.lib has mainCRTStartup and fflush
            //  legacy_stdio_definitions.lib has fprintf
            return ["link", [objfile, "/OUT:" + exefile,
                    "/SUBSYSTEM:CONSOLE", "/LARGEADDRESSAWARE:no",
                    "/nologo", "msvcrt.lib", "oldnames.lib",
                    "legacy_stdio_definitions.lib"]];
        case "darwin":
            return ["ld", ["-o", exefile, objfile, "-macosx_version_min", "10.13", "-lSystem"]];
        default:
            throw new Error();
    }
}
//let subshell: any=undefined;
function link(objfile, exefile) {
    try {
        fs.unlinkSync(exefile);
    }
    catch (e) {
    }
    if (access(exefile))
        throw new Error("Still there!");
    let ldexe;
    let ldargs = [];
    let input = "";
    [ldexe, ldargs] = getLinker(objfile, exefile);
    switch (process.platform) {
        case "linux":
            break;
        case "win32":
            if (!access(VSBAT)) {
                console.log("The VS tools are not installed. I can't continue.");
                process.exit(1);
            }
            input = `"${VSBAT}"\n`;
            input += `cd "${process.cwd()}"\n`;
            input += `"${ldexe}" `;
            ldargs.forEach((s) => {
                input += `"${s}" `;
            });
            input += "\n";
            input += "exit\n";
            ldexe = "cmd";
            ldargs = [];
            break;
        case "darwin":
            break;
        default:
            throw new Error();
    }
    let rv = subprocess.spawnSync(ldexe, ldargs, {
        encoding: "utf8",
        input: input,
        shell: false
    });
    let so = (rv.stdout || "").trim();
    let se = (rv.stderr || "").trim();
    if (so.length)
        console.log(so);
    if (se.length)
        console.log(se);
    if (!access(exefile))
        throw new Error("Link failed");
}
exports.link = link;
let buffered = "";
let blarg1 = "_-_-_-_-_-_-_-_";
let blarg2 = "-_-_-_-_-_-_-_";
let flag = blarg1 + " " + blarg2;
let subshell = undefined;
let subshellCallback = undefined;
function startSubshell() {
    console.log("Starting worker shell...");
    let [exe, inp] = getShell();
    subshell = subprocess.spawn(exe, [], {
        stdio: "pipe",
        windowsHide: true
    });
    subshell.stdout.on("data", (data) => {
        data = data.toString();
        process.stdout.write(data);
        if (subshellCallback !== undefined) {
            buffered += data;
            let idx = buffered.indexOf(flag);
            if (idx !== -1) {
                let j = idx - 2;
                while (j > 0 && (buffered[j] !== ' ' && buffered[j] !== '\r' && buffered[j] !== '\n'))
                    j--;
                if (j < 0)
                    j = 0;
                let rv;
                rv = parseInt(buffered.substring(j, idx).trim(), 10);
                if (rv !== rv) {
                    //nan
                    rv = -1;
                    console.log(j, idx, "--->" + buffered + "<---");
                }
                buffered = buffered.substring(idx + flag.length);
                let tmp = subshellCallback;
                subshellCallback = undefined;
                if (rv)
                    tmp(rv);
                else
                    tmp(undefined);
            }
        }
    });
    subshell.stderr.on("data", (data) => {
        data = data.toString();
        console.log(data);
    });
    inp += getSet() + " blarg1=" + blarg1 + "\n";
    inp += getSet() + " blarg2=" + blarg2 + "\n";
    console.log(inp);
    subshell.stdin.write(inp);
    console.log("Started");
}
function quitAsync() {
    if (subshell !== undefined) {
        subshell.stdin.end();
        subshell = undefined;
    }
}
exports.quitAsync = quitAsync;
function linkAsync(objfile, exefile, callback) {
    if (subshell === undefined) {
        startSubshell();
    }
    try {
        let [ldexe, ldargs] = getLinker(objfile, exefile);
        let input1;
        let input;
        switch (process.platform) {
            case "linux":
            case "darwin":
                input1 = `"${ldexe}" ` + ldargs.join(" ");
                input = input1 + "\necho Link $? $blarg1 $blarg2\n";
                break;
            case "win32":
                input1 = `"${ldexe}" `;
                ldargs.forEach((s) => {
                    input1 += `"${s}" `;
                });
                input = input1 + "\necho Link %ErrorLevel% %blarg1% %blarg2%\n";
                break;
            default:
                throw new Error();
        }
        subshellCallback = callback;
        //console.log(input1);
        subshell.stdin.write(input);
    }
    catch (e) {
        callback(e);
    }
}
exports.linkAsync = linkAsync;
//# sourceMappingURL=exetools.js.map