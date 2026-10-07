import {V2, Vec2} from "../../../anigraph";

/*
    Go through vertices of the hull AND calculate underwater area (assume proportional to volume)
    Take [Vec2[] of boat vertices, waterline-point relative to boat anchor]
    return V2(x-centroid, submerged-area)
 */

export function SubmergedSection(hull: Vec2[], waterY: number) {
    const epsilon = 1e-6;

    const wetVerts: Vec2[] = [];    // store submerged vertices
    const isWet = (pt: Vec2)=> (pt.y <= waterY);
    const intersectWaterlineX = (pt1: Vec2, pt2: Vec2) => {
        const dy = pt2.y - pt1.y;
        if (Math.abs(dy) < epsilon)
            return V2((pt1.x+pt1.x)/2, waterY);
        const lerp = (waterY - pt1.y) / dy;
        return V2(pt1.x + lerp*(pt2.x-pt1.x), waterY);
    };

    for (let i = 0; i < hull.length; ++i) {
        const vertA = hull[i];                     // current vertex
        const vertB = hull[(i + 1) % hull.length]; // next vertex

        const areWet = {cur: isWet(vertA), next: isWet(vertB)};

        if (areWet.cur) {
            wetVerts.push( (areWet.next) ? vertB : intersectWaterlineX(vertA,vertB) );
        } else if (areWet.next) {
            wetVerts.push( intersectWaterlineX(vertA,vertB), vertB );
        }
    }
    if (wetVerts.length < 3) return { CenterX: 0, CenterY: 0, Area: 0 };

    // Based on the Shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula)
    // and (https://artofproblemsolving.com/wiki/index.php/Shoelace_Theorem?srsltid=AU7gw4UXe_a7C5ok3ii-svFt7SqBS93y2HQZX5OAbcUmfl7jJ35Z5jmd)
    /*  Signed area:
     *      A = (1/2) * Σ(x_i y_{i+1} - x_{i+1} y_i)
     *  Centroid
     *      Cx = (1/6A) Σ((x_i+x_{i+1}) crossP)
     *      Cy = (1/6A) Σ((y_i+y_{i+1}) crossP)
     */
    let twiceArea = 0,
        centXnumerator = 0,
        centYnumerator = 0;
    for (let i = 0; i < wetVerts.length; ++i) {
        const vertA = wetVerts[i];
        const vertB = wetVerts[(i+1) % wetVerts.length];  // current and next vertex
        const crossP = vertA.x*vertB.y - vertB.x*vertA.y; // twice the area underwater
        twiceArea += crossP;
        centXnumerator += crossP * (vertA.x + vertB.x);
        centYnumerator += crossP * (vertA.y + vertB.y);
    }
    if (Math.abs(twiceArea) < epsilon)
        return { CenterX: 0, CenterY: 0, Area: 0 };
    return {
        CenterX: centXnumerator / (3 * twiceArea),
        CenterY: centYnumerator / (3 * twiceArea),
        Area:    Math.abs(twiceArea),
    };
}