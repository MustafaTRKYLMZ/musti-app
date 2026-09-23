import {
  computeReceiptFrameBounds,
  mapPreviewFrameToPhotoCrop,
} from "../services/receipt/receiptFrame";

describe("receiptFrame", () => {
  it("computes a portrait frame inside the preview", () => {
    const frame = computeReceiptFrameBounds({
      layoutWidth: 360,
      layoutHeight: 720,
      topInset: 24,
      bottomReserved: 140,
    });

    expect(frame.width).toBeGreaterThan(300);
    expect(frame.height).toBeGreaterThan(frame.width);
    expect(frame.left).toBeGreaterThan(0);
  });

  it("maps preview frame coordinates to photo crop", () => {
    const frame = { left: 20, top: 100, width: 320, height: 640 };
    const crop = mapPreviewFrameToPhotoCrop(
      frame,
      { width: 360, height: 720 },
      { width: 1440, height: 2880 }
    );

    expect(crop.originX).toBeGreaterThanOrEqual(0);
    expect(crop.originY).toBeGreaterThanOrEqual(0);
    expect(crop.width).toBeGreaterThan(300);
    expect(crop.height).toBeGreaterThan(600);
  });
});
