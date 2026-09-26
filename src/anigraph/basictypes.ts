/** A class whose instances have type `T` (anything you can call `new` on to get a `T`). */
export type Constructor<T> = new (...args: any[]) => T;
/** Any function. */
export type CallbackType = (...args: any[]) => any;
/** A plain object with string keys and values of any type. */
export type GenericDict = { [name: string]: any };

/** A class (constructor function) whose instances have type `InstanceClass`. */
export interface ClassInterface<InstanceClass> extends Function {
  new (...args: any[]): InstanceClass;
}

/** Events signaled by the model graph (`AModelGraph`) when nodes are added, removed, or released. */
export enum SceneGraphEvents{
    // Fired by AModelGraph for every node in an added subtree, root first (preorder). It can fire again for a node
    // that is already in the graph, e.g. one reparented within it; listeners should treat a repeat as a no-op.
    // This does not directly trigger the creation of a view.
    NodeAdded="NodeAdded",
    // Fired by AModelGraph when a node is removed from the graph.
    NodeRemoved="NodeRemoved",
    // Fired by AModelGraph exactly once per registered node when it is released, including a node released after it
    // was detached from the graph.
    NodeReleased="NodeReleased",
    // Fired by ASceneModel.signalComponentUpdate(); heard through ASceneModel.addComponentUpdateListener(). The GUI
    // components use it to re-render.
    UpdateComponent="UpdateComponent"
}


/** Data types a shader uniform can have. */
export const enum SHADER_UNIFORM_TYPES{
  FLOAT,
  INT,
  VEC2,
  VEC3,
  VEC4,
  COLOR3,
  COLOR4,
  MAT2,
  MAT3,
  MAT4,
  CUSTOM
}

/** Callback for a change to an app state value; called with the new value. */
export type AppStateValueChangeCallback =(v:any)=>void;

/** Names of the uniforms (and control panel values) of the basic diffuse shader. */
export const BasicDiffuseShaderAppState = {
  Ambient:"ambient",
  Diffuse:"diffuse",
    Falloff: "falloff"
}


/** Names of the uniforms (and control panel values) of the Blinn-Phong shader: the diffuse ones plus specular. */
export const  BlinnPhongShaderAppState = {
  ...BasicDiffuseShaderAppState,
  Specular:"specular",
  SpecularExp:"specularExp"
}

/**
 * Throws an error (after logging `message` as a console warning) if `x` is falsy.
 * @param x the condition that should be true
 * @param message describes what went wrong
 */
export function assert(x:any, message?:string){
  if(!x){
    console.warn(message);
    throw new Error(`ASSERT ERROR: ${message}`);
  }
}
