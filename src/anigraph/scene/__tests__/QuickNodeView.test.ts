/**
 * Tests for `QuickNodeView`: its `init`, `update`, and `dispose` callbacks are optional, so a
 * view made without some of them must still run those methods without throwing.
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeModel3D} from "../nodeModel/AGroupNodeModel3D";
import {QuickNodeView} from "../QuickNodeView";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

describe("QuickNodeView", () => {
    test("a view with only an init callback can update and dispose", () => {
        const model = new AGroupNodeModel3D();
        const init = jest.fn();
        const view = QuickNodeView.Create(model, init);
        expect(init).toHaveBeenCalledWith(view);
        expect(() => view.update()).not.toThrow();
        expect(() => view.dispose()).not.toThrow();
    });

    test("a view constructed with no callbacks at all can init, update and dispose", () => {
        const view = new QuickNodeView();
        view.setModel(new AGroupNodeModel3D());
        expect(() => view.init()).not.toThrow();
        expect(() => view.update()).not.toThrow();
        expect(() => view.dispose()).not.toThrow();
    });

    test("callbacks that are given are called with the view", () => {
        const model = new AGroupNodeModel3D();
        const update = jest.fn();
        const dispose = jest.fn();
        const view = new QuickNodeView(model, () => {}, update, dispose);
        update.mockClear();
        view.update();
        expect(update).toHaveBeenCalledWith(view);
        view.dispose();
        expect(dispose).toHaveBeenCalledWith(view);
    });

    test("constructing with a model but no init callback throws a clear error", () => {
        expect(() => new QuickNodeView(new AGroupNodeModel3D())).toThrow(/constructor/);
    });
});
