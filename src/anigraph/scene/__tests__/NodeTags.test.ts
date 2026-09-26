import {ASceneModel} from "../ASceneModel";
import {ANodeModel2D} from "../nodeModel/ANodeModel2D";
import {ASerializable, ASerializableFromJSON, ASerializableToJSON} from "../../base/aserial";
import type {AppState} from "../../appstate";

/**
 * Node tags (`addTag`/`hasTag`/`setTagValue`/`getTagValue`/`removeTag` on `ANodeModel`), and finding tagged nodes in
 * a scene with `ASceneModel.getNodesWithTag`, as shown in the C1 AniGraph docs ("Tagging Nodes & Finding Nodes by Tag").
 */
class TestSceneModel extends ASceneModel {
    protected initScene(...args: any[]): void {}
    initAppState(appState: AppState): void {}
    initCamera(...args: any[]): void {}
    timeUpdate(...args: any[]): void {}
}

@ASerializable("NodeTagsTestNode")
class TestNode extends ANodeModel2D {}

describe("ANodeModel tags", () => {
    test("a new node has no tags", () => {
        const node = new TestNode();
        expect(node.hasTag("enemy")).toBe(false);
        expect(node.getTagValue("enemy")).toBeUndefined();
    });

    test("addTag adds a tag with the value true", () => {
        const node = new TestNode();
        node.addTag("enemy");
        expect(node.hasTag("enemy")).toBe(true);
        expect(node.getTagValue("enemy")).toBe(true);
    });

    test("setTagValue stores a value, and a falsy value still counts as present", () => {
        const node = new TestNode();
        node.setTagValue("team", "red");
        node.setTagValue("frozen", false);
        expect(node.getTagValue("team")).toBe("red");
        expect(node.hasTag("frozen")).toBe(true);
        expect(node.getTagValue("frozen")).toBe(false);
    });

    test("removeTag removes the tag, and does nothing if it is absent", () => {
        const node = new TestNode();
        node.addTag("enemy");
        node.removeTag("enemy");
        expect(node.hasTag("enemy")).toBe(false);
        expect(() => node.removeTag("enemy")).not.toThrow();
    });

    test("tags are per node", () => {
        const a = new TestNode();
        const b = new TestNode();
        a.addTag("enemy");
        expect(b.hasTag("enemy")).toBe(false);
    });
});

describe("finding nodes by tag", () => {
    test("getNodesWithTag finds tagged nodes, including nested ones", () => {
        const scene = new TestSceneModel("scene");
        const enemy1 = new TestNode();
        const enemy2 = new TestNode();
        const player = new TestNode();
        enemy1.addTag("enemy");
        enemy2.addTag("enemy");
        player.addTag("player");
        scene.addNode(enemy1);
        scene.addNode(player);
        player.addChild(enemy2);

        const enemies = scene.getNodesWithTag("enemy");
        expect(enemies).toHaveLength(2);
        expect(enemies).toContain(enemy1);
        expect(enemies).toContain(enemy2);
        expect(scene.getNodesWithTag("player")).toEqual([player]);
    });

    test("getNodesWithTag with a value matches only that value", () => {
        const scene = new TestSceneModel("scene");
        const red = new TestNode();
        const blue = new TestNode();
        red.setTagValue("team", "red");
        blue.setTagValue("team", "blue");
        scene.addNode(red);
        scene.addNode(blue);

        expect(scene.getNodesWithTag("team", "red")).toEqual([red]);
        expect(scene.getNodesWithTag("team", "green")).toEqual([]);
        expect(scene.getNodesWithTag("team")).toHaveLength(2);
    });

    test("getNodesWithTag with a value of false matches tags set to false", () => {
        const scene = new TestSceneModel("scene");
        const frozen = new TestNode();
        const moving = new TestNode();
        frozen.setTagValue("moving", false);
        moving.setTagValue("moving", true);
        scene.addNode(frozen);
        scene.addNode(moving);

        expect(scene.getNodesWithTag("moving", false)).toEqual([frozen]);
    });

    test("getNodesWithTag returns an empty array when no node has the tag", () => {
        const scene = new TestSceneModel("scene");
        scene.addNode(new TestNode());
        expect(scene.getNodesWithTag("enemy")).toEqual([]);
    });

    test("a removed tag is no longer found", () => {
        const scene = new TestSceneModel("scene");
        const node = new TestNode();
        node.addTag("enemy");
        scene.addNode(node);
        node.removeTag("enemy");
        expect(scene.getNodesWithTag("enemy")).toEqual([]);
    });
});

describe("tags and serialization", () => {
    test("tags survive a save/load round trip", () => {
        const node = new TestNode();
        node.addTag("enemy");
        node.setTagValue("team", "red");

        const loaded = ASerializableFromJSON<TestNode>(ASerializableToJSON(node));
        expect(loaded).toBeInstanceOf(TestNode);
        expect(loaded.hasTag("enemy")).toBe(true);
        expect(loaded.getTagValue("team")).toBe("red");
    });
});
