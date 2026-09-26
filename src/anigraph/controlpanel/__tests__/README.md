# __tests__

Jest specs for the [controlpanel](../README.md) module.

## Contents:
- [./AControlSpecGroup.test.ts](./AControlSpecGroup.test.ts): Tests `AControlSpecGroup`: registering every control type, `addSliderIfMissing` (only adds a slider that isn't there yet), how `onChange` callbacks combine, nesting (a plain spec dict or an already-built group), `mergeControlSpecGroup`, the shapes `getRawSpec`/`getFolderSpec` return, and `findControlPath` for every folder-nesting and key-suffixing case.
