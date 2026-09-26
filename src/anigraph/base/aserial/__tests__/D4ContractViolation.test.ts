import { ASerializable, AUnregisterSerializable } from "../ASerializable";

/**
 * The zero-arg-constructor-or-`fromJSON` construction contract is enforced at decoration
 * time (module load), not first use -- `@ASerializable` runs
 * `WarnIfConstructionContractViolated` synchronously inside the decorator
 * itself. Each fixture class below is declared inline, inside its own
 * test, so the decorator runs for the first time right there where the
 * `console.warn` spy can observe it; each is unregistered afterward so
 * this file can declare more than one fixture class without tripping the
 * registry's collision warning against itself on a second test run in the same
 * process.
 */
describe("construction-contract warning fires at decoration time", () => {
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  afterEach(() => {
    warnSpy.mockClear();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  test("a class with a required constructor argument and no fromJSON warns immediately when decorated", () => {
    expect(warnSpy).not.toHaveBeenCalled();

    @ASerializable("D4BadContractFixture")
    class D4BadContractFixture {
      constructor(public required: string) {}
    }
    void D4BadContractFixture; // decorator already ran by this point

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/D4BadContractFixture/);
    expect(warnSpy.mock.calls[0][0]).toMatch(/required constructor argument/);

    AUnregisterSerializable("D4BadContractFixture");
  });

  test("a class with a zero-arg constructor does not warn", () => {
    expect(warnSpy).not.toHaveBeenCalled();

    @ASerializable("D4GoodContractFixtureCtor")
    class D4GoodContractFixtureCtor {
      constructor() {}
    }
    void D4GoodContractFixtureCtor;

    expect(warnSpy).not.toHaveBeenCalled();
    AUnregisterSerializable("D4GoodContractFixtureCtor");
  });

  test("a class with a required constructor argument but a static fromJSON does not warn", () => {
    expect(warnSpy).not.toHaveBeenCalled();

    @ASerializable("D4GoodContractFixtureFromJSON")
    class D4GoodContractFixtureFromJSON {
      constructor(public required: string) {}
      static fromJSON(data: { required: string }) {
        return new D4GoodContractFixtureFromJSON(data.required);
      }
    }
    void D4GoodContractFixtureFromJSON;

    expect(warnSpy).not.toHaveBeenCalled();
    AUnregisterSerializable("D4GoodContractFixtureFromJSON");
  });
});
