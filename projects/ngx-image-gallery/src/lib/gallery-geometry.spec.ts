import {
  calculateZoomBounds,
  clampPan,
  fitIntoViewport,
  getImageSource,
  resolveImageDimensions,
} from './gallery-geometry';

describe('gallery geometry', () => {
  it('uses explicit image dimensions when provided', () => {
    const dimensions = resolveImageDimensions(
      { fullSrc: 'full.jpg', width: 2400, height: 1200 },
      undefined,
      1600,
    );

    expect(dimensions).toEqual({
      width: 2400,
      height: 1200,
      provisional: false,
    });
  });

  it('creates provisional dimensions from the thumbnail ratio', () => {
    const origin = document.createElement('a');
    Object.defineProperty(origin, 'getBoundingClientRect', {
      value: () => ({ width: 320, height: 160, top: 0, left: 0, right: 320, bottom: 160 }),
    });

    const dimensions = resolveImageDimensions({ fullSrc: 'full.jpg' }, origin, 1600);

    expect(dimensions).toEqual({
      width: 1600,
      height: 800,
      provisional: true,
    });
  });

  it('falls back to a square provisional size without a measurable thumbnail', () => {
    const dimensions = resolveImageDimensions({ fullSrc: 'full.jpg' }, undefined, 1200);

    expect(dimensions).toEqual({
      width: 1200,
      height: 1200,
      provisional: true,
    });
  });

  it('prefers thumbSrc and falls back to the nested image source', () => {
    const origin = document.createElement('a');
    const image = document.createElement('img');
    image.src = 'thumb-from-dom.jpg';
    origin.appendChild(image);

    expect(getImageSource({ fullSrc: 'full.jpg', thumbSrc: 'thumb.jpg' }, origin)).toBe(
      'thumb.jpg',
    );
    expect(getImageSource({ fullSrc: 'full.jpg' }, origin)).toContain('thumb-from-dom.jpg');
  });

  it('fits an image inside the padded viewport', () => {
    const fitted = fitIntoViewport({ width: 2400, height: 1200 }, { width: 1000, height: 800 }, 32);

    expect(fitted.width).toBe(936);
    expect(fitted.height).toBe(468);
    expect(fitted.x).toBe(32);
    expect(fitted.y).toBe(166);
  });

  it('calculates zoom bounds and clamps pan to visible overflow', () => {
    const zoom = calculateZoomBounds({ width: 2400, height: 1200 }, { width: 800, height: 400 });
    const pan = clampPan(
      { x: 5000, y: -5000 },
      { width: 1000, height: 800 },
      { width: 800, height: 400 },
      zoom.maxScale,
    );

    expect(zoom.maxScale).toBe(3);
    expect(pan).toEqual({ x: 700, y: -200 });
  });
});
