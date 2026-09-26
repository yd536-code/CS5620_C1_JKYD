import { AModelGraph, AObjectNode, SceneGraphEvents } from '../../';

describe('AModelGraph addNode', () => {
  test('modelMap contains node after addNode', () => {
    const graph = new AModelGraph('testGraph');
    const node = new AObjectNode('node1');
    graph.addNode(node);
    expect(node.uid in graph.modelMap).toBe(true);
    node.release();
  });

  test('SceneGraphEvents.NodeAdded fires after addNode', () => {
    const graph = new AModelGraph('testGraph');
    const node = new AObjectNode('node1');
    let addedUID = null;
    graph.addEventListener(SceneGraphEvents.NodeAdded, (n) => { addedUID = n.uid; });
    graph.addNode(node);
    expect(addedUID).toBe(node.uid);
    node.release();
  });

  test('adding the same node twice does not duplicate in modelMap', () => {
    const graph = new AModelGraph('testGraph');
    const node = new AObjectNode('node1');
    graph.addNode(node);
    const countBefore = Object.keys(graph.modelMap).length;
    graph._addModel(node);
    expect(Object.keys(graph.modelMap).length).toBe(countBefore);
    node.release();
  });
});

describe('AModelGraph removeChild', () => {
  test('SceneGraphEvents.NodeRemoved fires after removeChild', () => {
    const graph = new AModelGraph('testGraph');
    const node = new AObjectNode('node1');
    graph.addNode(node);
    let removedUID = null;
    graph.addEventListener(SceneGraphEvents.NodeRemoved, (n) => { removedUID = n.uid; });
    graph.removeChild(node);
    expect(removedUID).toBe(node.uid);
  });
});

describe('AModelGraph hierarchy (incremental adds)', () => {
  test('nodes added incrementally are each registered in modelMap', () => {
    const graph = new AModelGraph('testGraph');
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    const grandchild = new AObjectNode('grandchild');

    // Add root to graph first, then build the tree incrementally
    graph.addNode(parent);
    parent.addChild(child);
    child.addChild(grandchild);

    expect(parent.uid in graph.modelMap).toBe(true);
    expect(child.uid in graph.modelMap).toBe(true);
    expect(grandchild.uid in graph.modelMap).toBe(true);
    parent.release();
  });

  test('hasModel returns true for all incrementally added nodes', () => {
    const graph = new AModelGraph('testGraph');
    const parent = new AObjectNode('p');
    const child = new AObjectNode('c');
    graph.addNode(parent);
    parent.addChild(child);
    expect(graph.hasModel(parent)).toBe(true);
    expect(graph.hasModel(child)).toBe(true);
    parent.release();
  });

  test('NodeAdded fires for each incrementally added descendant', () => {
    const graph = new AModelGraph('testGraph');
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    const addedUIDs = [];
    graph.addEventListener(SceneGraphEvents.NodeAdded, (n) => { addedUIDs.push(n.uid); });

    graph.addNode(parent);
    parent.addChild(child);

    expect(addedUIDs).toContain(parent.uid);
    expect(addedUIDs).toContain(child.uid);
    parent.release();
  });
});
