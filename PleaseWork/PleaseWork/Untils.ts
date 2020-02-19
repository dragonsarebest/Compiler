export function union(set1: Set < any >, set2: Set<any>)
{
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

export function setToString(s: Set<any>) {
    let L: string[] = [];
    s.forEach((x: any) => {
        L.push(x.toString());
    });
    L.sort();
    return L.join(" ");
}