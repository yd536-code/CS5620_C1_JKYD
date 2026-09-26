/** Something that can carry named tags, each with an optional value (implemented by `ANodeModel`). */
export interface HasTags{
    /** Adds a tag with no particular value. */
    addTag(tagName:string):void
    /** Sets a tag's value (adding the tag if needed). */
    setTagValue(tagName:string, value:any):void
    /** Whether the tag is present. */
    hasTag(tagName:string):boolean;
    /** Returns the tag's value. */
    getTagValue(tagName:string):any;
    /** Removes the tag. */
    removeTag(tagName:string):void;
}
