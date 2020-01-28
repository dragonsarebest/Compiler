export class Grammar
{
    //likewise her
    constructor(input: string)
    {
        let lines = input.split("\n");
       
        let expression = new RegExp("([^ ]*)( -> )(.*)", "i");

        let s: Set<string> = new Set();

        console.log("---------------------------------------------------");
        lines.forEach(element =>
        {
            console.log("\n" + element);
            let match = expression.exec(element);
            if (match) {
                let left = match[1].trim();
                //console.log("left:" + left);
                //console.log("middle:" + match[2]);
                //console.log("right:" + match[3]);

                try {
                    let regex = new RegExp(match[3]);

                }
                catch
                {
                    throw "Righthandside is not a propperly formatted regex expression!";
                }

                if (s.has(left)) {
                    throw "Lefthandside has been defined more than once!";
                }
                else {
                    s.add(left);
                }


            }
            else
            {
                if (element.length > 0)
                {
                    //console.log("WRONG:::" + element);
                    throw "Grammar is impropperly formatted!";
                }                
            }
        })
    }

}