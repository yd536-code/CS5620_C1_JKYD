/**
 * Tests for the members both backends share through the `ASceneView` base: the model->view bookkeeping (`hasModel`, `hasView`, `addView`,
 * `getViewListForModel`, `_getViewListForModelID`, `disposeViews`, `release`), the model-class->view-class
 * registry (`classMap`/`defaultViewClass`/`setDefaultViewClass`/`addModelViewSpec`), and `onModelNodeReleased`.
 *
 * `onModelNodeReleased` must call `.release()` (not just `.dispose()`) on each view: only `.release()` also
 * unsubscribes the view's own model listeners (state, geometry, visibility, render-order, transform), which would
 * otherwise stay subscribed forever whenever a node is released from a *running* scene (see
 * `ANodeView.release()`/`AObject.release()`). This suite pins that behavior along with the rest of the shared
 * implementation.
 *
 * `ASceneView` is abstract with several other abstract members (`removeView`, `releaseView`,
 * `onModelNodeAdded`/`onModelNodeRemoved`, `addNodeViewToRoot`, `model`) that stay backend-specific. Rather than
 * calling isolated prototype methods against a bare object (which would need every transitively-called sibling
 * method re-mocked), each test builds a fake instance via `Object.create(ASceneView.prototype)`: real shared
 * methods (`hasModel`, `getViewListForModel`, ...) resolve normally through the prototype chain, and a test
 * overrides only the specific abstract/backend method it needs to fake, as an own property that shadows nothing
 * (there is no concrete implementation to shadow -- these are the abstract members).
 */
import {ASceneView} from "../ASceneView";
import {AModelViewClassMap} from "../../base/amvc/AModelViewClassSpec";

function fakeSceneView(overrides: any = {}): any {
    return Object.assign(Object.create(ASceneView.prototype), {_viewMap: {}, ...overrides});
}

function fakeView(modelID: string, uid: string, extra: any = {}) {
    return {modelID, uid, ...extra};
}

describe("ASceneView view-map bookkeeping", () => {
    test("addView creates the per-model map lazily, then hasModel/hasView/getViewListForModel see it", () => {
        const view = fakeSceneView();
        const v1 = fakeView("model-1", "view-1");

        expect(view.hasModel({uid: "model-1"})).toBe(false);

        view.addView(v1);

        expect(view.hasModel({uid: "model-1"})).toBe(true);
        expect(view.hasView(v1)).toBe(true);
        expect(view.hasView(fakeView("model-1", "view-2"))).toBe(false);
        expect(view.getViewListForModel({uid: "model-1"})).toEqual([v1]);
        expect(view.getViewListForModel({uid: "no-such-model"})).toEqual([]);
    });

    test("addView appends a second view for the same model rather than overwriting it", () => {
        const view = fakeSceneView();
        const v1 = fakeView("model-1", "view-1");
        const v2 = fakeView("model-1", "view-2");

        view.addView(v1);
        view.addView(v2);

        expect(view.getViewListForModel({uid: "model-1"})).toEqual([v1, v2]);
        expect(view._getViewListForModelID("model-1")).toEqual([v1, v2]);
        expect(view._getViewListForModelID("no-such-model")).toEqual([]);
    });

    test("disposeViews releases every view via the backend-specific releaseView, then clears the map", () => {
        const released: any[] = [];
        const view = fakeSceneView({
            _viewMap: {"model-1": {"view-1": fakeView("model-1", "view-1"), "view-2": fakeView("model-1", "view-2")}},
            releaseView: (v: any) => released.push(v),
        });

        view.disposeViews();

        expect(released.map(v => v.uid).sort()).toEqual(["view-1", "view-2"]);
        expect(view._viewMap).toEqual({});
    });

    test("release() disposes views, then delegates up the prototype chain (AView/AObject.release)", () => {
        const disposeCalls: number[] = [];
        let superReleaseCalls = 0;
        const view = fakeSceneView({
            disposeViews: () => disposeCalls.push(1),
            // `super.release()` inside ASceneView.prototype.release resolves through the real prototype chain
            // (AView -> AObject), whose `release()` calls `this.clearSubscriptions()` and then removes the state
            // listeners in `this.listeners`.
            clearSubscriptions: () => { superReleaseCalls++; },
            listeners: {},
            _eventCallbackDicts: {},
        });

        view.release();

        expect(disposeCalls).toEqual([1]);
        expect(superReleaseCalls).toBe(1);
    });
});

describe("ASceneView model-class -> view-class registry", () => {
    test("addModelViewSpec registers on classMap; defaultViewClass is used when no spec matches", () => {
        class FakeModel {}
        class FakeView {}
        const view = fakeSceneView({classMap: new AModelViewClassMap()});

        view.addModelViewSpec(FakeModel as any, FakeView as any);
        // getSpecForModel looks up a non-ANodeModel by class name (see AModelViewClassMap.getSpecForModel) --
        // pass the class itself, not an instance, since FakeModel isn't a real ANodeModel with a serializationLabel.
        const spec = view.classMap.getSpecForModel(FakeModel);
        expect(spec?.viewClass).toBe(FakeView);

        expect(view.defaultViewClass).toBeUndefined();
        view.setDefaultViewClass(FakeView as any);
        expect(view.defaultViewClass).toBe(FakeView);
    });
});

describe("ASceneView.onModelNodeReleased", () => {
    test("calls .release() (not .dispose()) on every view of the released model, then deletes the map entry", () => {
        const calls: string[] = [];
        const v = fakeView("model-1", "view-1", {
            release: () => calls.push("release"),
            dispose: () => calls.push("dispose"),
        });
        const view = fakeSceneView({_viewMap: {"model-1": {"view-1": v}}});

        view.onModelNodeReleased({uid: "model-1"});

        expect(calls).toEqual(["release"]);
        expect(view._viewMap["model-1"]).toBeUndefined();
    });

    test("releases every view when a model has more than one", () => {
        const released: string[] = [];
        const v1 = fakeView("model-1", "view-1", {release: () => released.push("view-1")});
        const v2 = fakeView("model-1", "view-2", {release: () => released.push("view-2")});
        const view = fakeSceneView({_viewMap: {"model-1": {"view-1": v1, "view-2": v2}}});

        view.onModelNodeReleased({uid: "model-1"});

        expect(released.sort()).toEqual(["view-1", "view-2"]);
    });
});
