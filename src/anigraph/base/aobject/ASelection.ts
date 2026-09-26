// import objectHash from "object-hash";
import { ALabel } from "../aserial";

/** Event names for selection changes. */
export enum SelectionEvents {
  SelectionChanged = "SelectionChanged",
  SelectionItemEnter = "SelectionItemEnter",
  SelectionItemUpdate = "SelectionItemUpdate",
  SelectionItemExit = "SelectionItemExit",
}

/**
 * # ASelection
 * A set of selected items of type `T`, keyed by each item's `uid` (see `_calcKey`). Optional callbacks run on items
 * that enter the selection, leave it, or stay in it when the selection changes.
 */
@ALabel("ASelection")
export class ASelection<T> {
  protected _selectionMap: { [key: string]: T };

  /** Called on each item that enters the selection. */
  public _enterCallback!: (enteringSelection: T, selection?: this) => void;
  /** Called on each item that stays in the selection when it is `set`. */
  public _updateCallback!: (remainingInSelection: T, selection?: this) => void;
  /** Called on each item that leaves the selection. */
  public _exitCallback!: (leavingSelection: T, selection?: this) => void;

  // protected abstract _selectionMap:{[key:string]:T};

  /** Returns the selected items as an array. */
  items() {
    return Object.values(this._selectionMap);
  }

  /** The number of selected items. */
  get nSelected() {
    return Object.keys(this._selectionMap).length;
  }

  /**
   * Returns the key used to store `item` in the selection. The default uses `item.uid` and throws for items that
   * don't have one. Subclasses can override it for other item types.
   * @param item
   * @returns the item's key
   * @private
   */
  static _calcKey(item: any) {
    if (typeof item == "object" && "uid" in item) {
      return item.uid;
    } else {
      // return objectHash(item);
      throw new Error(`Not sure how to hash ${item} in ASelection!`);
    }
  }

  /**
   * @param items optional initial items to select (no callbacks are called for them)
   * @param enterCallback called on each item that enters the selection
   * @param updateCallback called on each item that stays in the selection when it is `set`
   * @param exitCallback called on each item that leaves the selection
   */
  constructor(
    items?: T[],
    enterCallback?: (enteringSelection: T, selection?: ASelection<T>) => void,
    updateCallback?: (
      remainingInSelection: T,
      selection?: ASelection<T>
    ) => void,
    exitCallback?: (leavingSelection: T, selection?: ASelection<T>) => void
  ) {
    this._selectionMap = {};
    if (items !== undefined) {
      this.set(items, false);
    }
    this._enterCallback = enterCallback
      ? enterCallback
      : (a: T) => {
          return;
        };
    this._updateCallback = updateCallback
      ? updateCallback
      : (a: T) => {
          return;
        };
    this._exitCallback = exitCallback
      ? exitCallback
      : (a: T) => {
          return;
        };
  }

  /** Calls `func` on each selected item and returns the list of results. */
  mapOverElements(func: (a: T) => any) {
    let rval = [];
    let items = this.items();
    for (let i of items) {
      rval.push(func(i));
    }
    return rval;
  }

  /**
   * Like `mapOverElements`, but leaves out items for which `func` returns `undefined`.
   */
  getFilteredList(func: (a: T) => any) {
    let rval = [];
    let items = this.items();
    for (let i of items) {
      let ival = func(i);
      if (ival !== undefined) {
        rval.push(ival);
      }
    }
    return rval;
  }

  /**
   * Returns the selected items as an array.
   */
  list() {
    const rval = new Array<T>();
    for (let key in this._selectionMap) {
      rval.push(this._selectionMap[key]);
    }
    return rval;
  }

  /**
   * Returns the keys of the selected items.
   */
  keys() {
    return Object.keys(this._selectionMap);
  }

  /**
   * Removes `item` from the selection and, if `triggerCallbacks`, calls the exit callback on it. Does nothing (and
   * calls no callback) if `item` wasn't selected.
   */
  deselect(item: T, triggerCallbacks = true) {
    const key = this._getKeyForItem(item);
    if (!(key in this._selectionMap)) {
      return;
    }
    this._deselectKey(key);
    if (triggerCallbacks) {
      this._exitCallback(item, this);
    }
  }

  /**
   * Removes the item with the given key, without callbacks.
   * @private
   */
  _deselectKey(key: string) {
    delete this._selectionMap[key];
  }

  /**
   * Clears the selection, without callbacks.
   */
  _deselectAll() {
    if (this.nSelected === 0) {
      return;
    }
    this._selectionMap = {};
    // for(let key in this._selectionMap){
    //     this._deselectKey(key);
    // }
  }

  /**
   * Adds `item` to the selection and, if `triggerCallback`, calls the enter callback on it. If an item with the
   * same key is already selected, it is replaced by `item` but no callback runs.
   */
  select(item: T, triggerCallback: boolean = true) {
    const key = this._getKeyForItem(item);
    const alreadySelected = key in this._selectionMap;
    this._selectKey(key, item);
    if (triggerCallback && !alreadySelected) {
      this._enterCallback(item, this);
    }
  }

  /** Stores `item` under `key`, without callbacks. */
  _selectKey(key: string, item: T) {
    this._selectionMap[key] = item;
  }

  /** Selects `item` if it isn't selected, or deselects it if it is, calling the matching callback if `triggerCallbacks`. */
  toggleSelected(item: T, triggerCallbacks = true) {
    let key = this._getKeyForItem(item);
    if (this._selectionMap[key]) {
      this._deselectKey(key);
      if (triggerCallbacks) {
        this._exitCallback(item, this);
      }
    } else {
      this._selectionMap[key] = item;
      if (triggerCallbacks) {
        this._enterCallback(item, this);
      }
    }
  }

  //
  // /**
  //  * Select item
  //  * @param item
  //  */
  // select(item:T){
  //     this._selectionMap[this._getKeyForItem(item)]=item;
  // }

  /**
   * Returns the key for `item`, using this class's `_calcKey`.
   * @private
   */
  _getKeyForItem(item: T) {
    return (this.constructor as typeof ASelection)._calcKey(item);
  }

  /**
   * Replaces the selection with `items`. Afterward, the exit callback runs on each item that left, then the enter
   * callback on each item that entered, then the update callback on each item that stayed. If the selection is
   * unchanged, only the update callbacks run. Passing no items (or an empty list) clears the selection.
   * @param items - What the selection should be after the operation is complete
   * @param triggerCallbacks - if false, the selection changes but no callbacks run
   * @param exitCallback - a function to run on items that leave the selection (defaults to the exit callback)
   * @param enterCallback - a function to run on items that enter the selection (defaults to the enter callback)
   * @param updateCallback - a function to run on items that stay in the selection (defaults to the update callback)
   */
  public set(
    items?: T[],
    triggerCallbacks = true,
    exitCallback?: (item: T, selection?: this) => void,
    enterCallback?: (item: T, selection?: this) => void,
    updateCallback?: (item: T, selection?: this) => void
  ) {
    if (triggerCallbacks) {
      exitCallback = exitCallback ? exitCallback : this._exitCallback;
      enterCallback = enterCallback ? enterCallback : this._enterCallback;
      updateCallback = updateCallback ? updateCallback : this._updateCallback;
    } else {
      // With no callbacks, the code below only updates the selection.
      exitCallback = undefined;
      enterCallback = undefined;
      updateCallback = undefined;
    }

    if (items === undefined || items.length === 0) {
      if (exitCallback !== undefined) {
        const exiting = Object.values(this._selectionMap);
        this._deselectAll();
        for (let leaving of exiting) {
          exitCallback(leaving, this);
        }
      } else {
        this._deselectAll();
      }
      return;
    } else {
      const newkeys = [];
      const enter = [];
      const exit = [];
      const update = [];

      for (let item of items) {
        let nkey = this._getKeyForItem(item);
        newkeys.push(nkey);
        if (nkey in this._selectionMap) {
          update.push(item);
        } else {
          enter.push(item);
        }
      }
      for (let oldkey in this._selectionMap) {
        if (!(newkeys.indexOf(oldkey) > -1)) {
          exit.push(this._selectionMap[oldkey]);
        }
      }

      // for (let ex of exit) {
      //     this.deselect(ex);
      // }
      // for(let en of enter){
      //     this.select(en);
      // }

      // if the selection is exactly the same, return without changing anything
      if (update.length === items.length && update.length === this.nSelected) {
        if (updateCallback) {
          for (let up of update) {
            updateCallback(up, this);
          }
        }
        return;
      }

      let newmap: { [key: string]: T } = {};
      for (let up of update) {
        newmap[this._getKeyForItem(up)] = up;
      }
      for (let n of enter) {
        newmap[this._getKeyForItem(n)] = n;
      }
      this._selectionMap = newmap;

      if (exitCallback) {
        for (let ex of exit) {
          exitCallback(ex, this);
        }
      }
      if (enterCallback) {
        for (let en of enter) {
          enterCallback(en, this);
        }
      }
      if (updateCallback) {
        for (let up of update) {
          updateCallback(up, this);
        }
      }
      return;
    }
  }
}
