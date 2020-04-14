"use strict";
exports.__esModule = true;
function union(set1, set2) {
    if (set2 == undefined && set1 != undefined)
        return set1;
    else if (set1 == undefined && set2 != undefined)
        return set2;
    else if (set1 == undefined && set2 == undefined)
        return undefined;
    var a = Array.from(set1);
    var b = Array.from(set2);
    var c = a.concat(b);
    return new Set(c);
}
exports.union = union;
function setToString(s) {
    var L = [];
    s.forEach(function (x) {
        L.push(x.toString());
    });
    L.sort();
    return L.join(" ");
}
exports.setToString = setToString;
//# sourceMappingURL=Untils.js.map