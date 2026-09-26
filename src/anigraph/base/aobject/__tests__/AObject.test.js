import { AObjectNode, AObjectNodeEvents } from '../../../';

describe('AObject uid', () => {
  test('uid is a non-empty string', () => {
    const node = new AObjectNode();
    expect(typeof node.uid).toBe('string');
    expect(node.uid.length).toBeGreaterThan(0);
  });

  test('two different AObjects have different uids', () => {
    const a = new AObjectNode();
    const b = new AObjectNode();
    expect(a.uid).not.toBe(b.uid);
  });
});

describe('AObjectState reactivity (via AObjectNode.name)', () => {
  test('addStateListener fires when @AObjectState field changes', () => {
    const node = new AObjectNode('initial');
    let fired = 0;
    node.addStateListener(() => { fired++; });
    node.name = 'changed';
    expect(fired).toBeGreaterThanOrEqual(1);
  });

  test('addStateKeyListener fires only for the specified key', () => {
    const node = new AObjectNode('start');
    let nameFired = 0;
    node.addStateKeyListener('name', () => { nameFired++; });
    node.name = 'updated';
    expect(nameFired).toBeGreaterThanOrEqual(1);
  });
});

describe('AObject events', () => {
  test('signalEvent triggers listener registered with addEventListener', () => {
    const node = new AObjectNode();
    let received = null;
    node.addEventListener('TestEvent', (val) => { received = val; });
    node.signalEvent('TestEvent', 42);
    expect(received).toBe(42);
  });

  test('listener fires with correct arguments', () => {
    const node = new AObjectNode();
    let args = [];
    node.addEventListener('MyEvent', (...a) => { args = a; });
    node.signalEvent('MyEvent', 'hello', 'world');
    expect(args[0]).toBe('hello');
    expect(args[1]).toBe('world');
  });

  test('listener registered for one event does not fire for a different event', () => {
    const node = new AObjectNode();
    let fired = false;
    node.addEventListener('EventA', () => { fired = true; });
    node.signalEvent('EventB', 99);
    expect(fired).toBe(false);
  });
});
