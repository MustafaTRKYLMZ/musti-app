const RECEIPT_HEIGHT_RATIO = 2;
const SIDE_MARGIN_RATIO = 0.02;
const HINT_BAND_HEIGHT = 36;

export type ReceiptFrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type FrameLayoutInput = {
  layoutWidth: number;
  layoutHeight: number;
  topInset?: number;
  bottomReserved?: number;
};

export function computeReceiptFrameBounds({
  layoutWidth,
  layoutHeight,
  topInset = 0,
  bottomReserved = 120,
}: FrameLayoutInput): ReceiptFrameRect {
  if (layoutWidth <= 0 || layoutHeight <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  const sideMargin = layoutWidth * SIDE_MARGIN_RATIO;
  const frameWidth = layoutWidth - sideMargin * 2;
  const reservedVertical = topInset + HINT_BAND_HEIGHT + bottomReserved;
  const maxHeight = Math.max(140, layoutHeight - reservedVertical);
  const idealHeight = frameWidth * RECEIPT_HEIGHT_RATIO;
  const frameHeight = Math.min(idealHeight, maxHeight);
  const left = sideMargin;
  const top =
    topInset +
    HINT_BAND_HEIGHT +
    Math.max(0, (maxHeight - frameHeight) / 2);

  return { left, top, width: frameWidth, height: frameHeight };
}

export function mapPreviewFrameToPhotoCrop(
  frame: ReceiptFrameRect,
  preview: { width: number; height: number },
  photo: { width: number; height: number },
  paddingRatio = 0.02
): { originX: number; originY: number; width: number; height: number } {
  if (
    preview.width <= 0 ||
    preview.height <= 0 ||
    photo.width <= 0 ||
    photo.height <= 0 ||
    frame.width <= 0 ||
    frame.height <= 0
  ) {
    return { originX: 0, originY: 0, width: photo.width, height: photo.height };
  }

  const scaleX = photo.width / preview.width;
  const scaleY = photo.height / preview.height;

  let originX = frame.left * scaleX;
  let originY = frame.top * scaleY;
  let width = frame.width * scaleX;
  let height = frame.height * scaleY;

  const padX = width * paddingRatio;
  const padY = height * paddingRatio;
  originX = Math.max(0, originX - padX);
  originY = Math.max(0, originY - padY);
  width = Math.min(photo.width - originX, width + padX * 2);
  height = Math.min(photo.height - originY, height + padY * 2);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.round(Math.max(1, width)),
    height: Math.round(Math.max(1, height)),
  };
}
