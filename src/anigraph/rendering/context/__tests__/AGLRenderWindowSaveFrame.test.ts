/**
 * Tests for `AGLRenderWindow._saveSingleFrameCallback`: the default frame-save callback
 * downloads the PNG blob with a temporary download link, instead of calling a global `saveAs` that nothing defines.
 *
 * Runs the real method against a fake `this` (only `serializationLabel` is read), the same "fake instance" approach
 * `ARenderWindow.test.ts` uses. jsdom has no `URL.createObjectURL`, so the test defines it (and `revokeObjectURL`)
 * and removes them afterward, and it stubs `HTMLAnchorElement.prototype.click` (jsdom does not implement navigation).
 * The real browser download is not tested here; it needs a real browser.
 */
import {AMeshModel2D} from "../../../";
import {AGLRenderWindow} from "../AGLRenderWindow";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

describe("AGLRenderWindow._saveSingleFrameCallback", () => {
    const urlAny = URL as any;
    let originalCreate: any, originalRevoke: any;
    beforeEach(() => {
        originalCreate = urlAny.createObjectURL;
        originalRevoke = urlAny.revokeObjectURL;
        urlAny.createObjectURL = jest.fn(() => "blob:frame");
        urlAny.revokeObjectURL = jest.fn();
    });
    afterEach(() => {
        urlAny.createObjectURL = originalCreate;
        urlAny.revokeObjectURL = originalRevoke;
    });

    test("downloads the blob as <serializationLabel>.png", () => {
        const downloads: string[] = [];
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
            downloads.push(`${this.download} ${this.href}`);
        });
        try {
            const blob = new Blob(["png"], {type: "image/png"});
            (AGLRenderWindow.prototype as any)._saveSingleFrameCallback.call({serializationLabel: "MyWindow"}, blob);
            expect(urlAny.createObjectURL).toHaveBeenCalledWith(blob);
            expect(downloads).toEqual(["MyWindow.png blob:frame"]);
            expect(urlAny.revokeObjectURL).toHaveBeenCalledWith("blob:frame");
        } finally {
            clickSpy.mockRestore();
        }
    });

    test("a null blob warns and downloads nothing", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        try {
            (AGLRenderWindow.prototype as any)._saveSingleFrameCallback.call({serializationLabel: "MyWindow"}, null);
            expect(warnSpy).toHaveBeenCalled();
            expect(clickSpy).not.toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
            clickSpy.mockRestore();
        }
    });
});
