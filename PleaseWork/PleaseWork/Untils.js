"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function union(set1, set2) {
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
exports.union = union;
function setToString(s) {
    let L = [];
    s.forEach((x) => {
        L.push(x.toString());
    });
    L.sort();
    return L.join(" ");
}
exports.setToString = setToString;
//# sourceMappingURL=Untils.js.map