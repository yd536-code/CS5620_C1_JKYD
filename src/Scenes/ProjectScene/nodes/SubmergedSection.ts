import {V2, Vec2} from "../../../anigraph";

/*
    Go through vertices of the hull AND calculate underwater area (assume proportional to volume)
    Take [Vec2[] of boat vertices, waterline-point relative to boat anchor]
    return V2(x-centroid, submerged-area)
 */

export function SubmergedSection(hull: Vec2[], waterY: number) {
    const wetVerts: Vec2[] = [];    // store submerged vertices

    for (let i = 0; i < hull.length; ++i) {
        const vertA = hull[i];
        const vertB = hull[(i + 1) % hull.length];  // current and next vertex

        if (vertA.y <= waterY)  // if vertex-A wetted
            wetVerts.push(vertA);
        if ((vertA.y <= waterY) !== (vertB.y <= waterY)) { // if the edge intersects the waterline
            const ptLerp = (waterY - vertA.y) / (vertB.y - vertA.y);
            wetVerts.push(V2(vertA.x + ptLerp*(vertB.x - vertA.x), waterY));
        }
    }

    // Based on the Shoelace formula (https://en.wikipedia.org/wiki/Shoelace_formula)
    // and (https://artofproblemsolving.com/wiki/index.php/Shoelace_Theorem?srsltid=AU7gw4UXe_a7C5ok3ii-svFt7SqBS93y2HQZX5OAbcUmfl7jJ35Z5jmd)
    let twiceArea = 0, momentX = 0;
    for (let i = 0; i < wetVerts.length; ++i) {
        const vertA = wetVerts[i];
        const vertB = wetVerts[(i + 1) % wetVerts.length];  // current and next vertex
        const crossP = vertA.x*vertB.y - vertB.x*vertA.y; // twice the area underwater
        twiceArea += crossP;
        momentX += crossP * (vertA.x + vertB.x);
    }
    if (Math.abs(twiceArea) < 5e-10)
        return {CenterX: 0, Area: 0};
    return {CenterX: momentX / (3 * twiceArea),
            Area:    Math.abs(twiceArea)/2,};
}