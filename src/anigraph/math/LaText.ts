/**
 * Helpers for building LaTeX strings (e.g., to display vectors and matrices with MathJax/KaTeX).
 */
export class LaText{
    /** Number of digits after the decimal point used when formatting numbers. */
    static nDigitsDisplay:number=3;
    /** Returns the opening inline-math delimiter `\(`. */
    static beginMath(){
        return "\\("
    }
    /** Returns the closing inline-math delimiter `\)`. */
    static endMath(){
        return "\\)"
    }
    /** Template tag that wraps the raw template text in `\(` ... `\)`, e.g. ``LaText.inline`x^2` ``. */
    static inline(strings: TemplateStringsArray){
        return "\\("+strings.raw+"\\)";
    }

    /** Template tag that returns the raw strings of the template (backslashes are not treated as escapes). */
    static raw(strings:TemplateStringsArray){
        return strings.raw;
    }

    /** Returns a `bmatrix` column vector with the given entries, formatted with `nDigitsDisplay` digits. */
    static columnVector(entries:number[]){
        let rstring = ""
        rstring = rstring+"\\begin{bmatrix}"
        for(let e of entries){
            rstring+=`${e.toFixed(LaText.nDigitsDisplay)}\\\\`
        }
        rstring = rstring+"\\end{bmatrix}"
        return rstring;
    }

    /**
     * Returns a `bmatrix` for a matrix given as a row-major list of entries.
     * @param entries The entries in row-major order (`entries[columns*r + c]`).
     * @param rows Number of rows.
     * @param columns Number of columns.
     */
    static matrix(entries:number[], rows:number, columns:number){
        let rstring = ""
        rstring = rstring+"\\begin{bmatrix}"
        for(let r=0;r<rows;r++) {
            for (let c = 0; c < columns; c++) {
                rstring += `${entries[columns*r+c].toFixed(LaText.nDigitsDisplay)}`
                if(c<columns-1){
                    rstring+=` &`
                }
            }
            if(r<rows-1){
                rstring+=`\\\\`
            }
        }
        rstring = rstring+"\\end{bmatrix}"
        return rstring;
    }
}


