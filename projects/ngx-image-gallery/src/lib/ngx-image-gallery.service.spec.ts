import { TestBed } from '@angular/core/testing';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import { provideNgxImageGallery } from './gallery-types';

class FakeImage {
  static requests: string[] = [];
  static naturalWidthValue = 2400;
  static naturalHeightValue = 1200;

  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = FakeImage.naturalWidthValue;
  naturalHeight = FakeImage.naturalHeightValue;
  width = FakeImage.naturalWidthValue;
  height = FakeImage.naturalHeightValue;
  currentSrc = '';
  sizes = '';
  srcset = '';

  private source = '';

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
    this.currentSrc = value;
    FakeImage.requests.push(value);
    window.setTimeout(() => this.onload?.(), 0);
  }
}

describe('NgxImageGalleryService', () => {
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeImage.requests = [];
    FakeImage.naturalWidthValue = 2400;
    FakeImage.naturalHeightValue = 1200;
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };
    vi.stubGlobal('Image', FakeImage);

    TestBed.configureTestingModule({
      providers: [
        provideNgxImageGallery({
          provisionalLongEdge: 1600,
        }),
      ],
    });
    service = TestBed.inject(NgxImageGalleryService);
  });

  afterEach(() => {
    service.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('does not request the full image before the opening animation finishes', () => {
    const origin = createOriginElement();

    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      0,
      { originElement: origin, originElements: [origin] },
    );

    expect(service.isOpen()).toBe(true);
    expect(FakeImage.requests).toEqual([]);

    vi.advanceTimersByTime(333);

    expect(FakeImage.requests).toEqual(['full-1.jpg']);
  });

  it('starts opening from the thumbnail transform before animating to the fitted layout', () => {
    const origin = createOriginElement();
    const frameCallbacks: FrameRequestCallback[] = [];
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      frameCallbacks.push(callback);
      return 1;
    };

    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0, {
      originElement: origin,
      originElements: [origin],
    });

    const media = document.querySelector<HTMLDivElement>('.ngx-image-gallery-media');
    expect(media).toBeTruthy();
    expect(media?.style.transition).toBe('none');
    expect(media?.style.transform).toContain('translate3d(30px, 20px, 0)');

    expect(frameCallbacks).toHaveLength(1);
    frameCallbacks[0]?.(0);

    expect(media?.style.transition).toBe('');
    expect(media?.style.transform).toContain('translate3d(32px, 144px, 0) scale(1)');
  });

  it('starts opening cropped thumbnails from the exact origin box', () => {
    const origin = createOriginElement({
      rect: { width: 200, height: 150, top: 20, left: 30 },
      objectFit: 'cover',
      objectPosition: '25% 75%',
    });
    const frameCallbacks: FrameRequestCallback[] = [];
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      frameCallbacks.push(callback);
      return 1;
    };

    service.open(
      [{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1600 }],
      0,
      { originElement: origin, originElements: [origin] },
    );

    const media = document.querySelector<HTMLDivElement>('.ngx-image-gallery-media');
    const thumb = document.querySelector<HTMLImageElement>('.ngx-image-gallery-thumb');
    expect(media?.classList.contains('ngx-image-gallery-origin-crop')).toBe(true);
    expect(media?.style.width).toBe('200px');
    expect(media?.style.height).toBe('150px');
    expect(media?.style.transform).toContain('translate3d(30px, 20px, 0) scale(1)');
    expect(thumb?.style.objectPosition).toBe('25% 75%');

    frameCallbacks[0]?.(0);

    expect(media?.classList.contains('ngx-image-gallery-origin-crop')).toBe(true);
    expect(media?.style.width).toBe('960px');
    expect(media?.style.height).toBe('640px');
    expect(media?.style.transform).toContain('translate3d(32px, 64px, 0) scale(1)');

    vi.advanceTimersByTime(333);

    expect(media?.classList.contains('ngx-image-gallery-origin-crop')).toBe(false);
    expect(thumb?.style.objectPosition).toBe('');
  });

  it('closes cropped thumbnails to the exact origin box', () => {
    FakeImage.naturalWidthValue = 2400;
    FakeImage.naturalHeightValue = 1600;
    const origin = createOriginElement({
      rect: { width: 200, height: 150, top: 20, left: 30 },
      objectPosition: '20% 80%',
    });

    service.open(
      [
        {
          fullSrc: 'full-1.jpg',
          thumbSrc: 'thumb-1.jpg',
          width: 2400,
          height: 1600,
          thumbCropped: true,
        },
      ],
      0,
      { originElement: origin, originElements: [origin] },
    );
    vi.advanceTimersByTime(333);

    service.close();

    const media = document.querySelector<HTMLDivElement>('.ngx-image-gallery-media');
    const thumb = document.querySelector<HTMLImageElement>('.ngx-image-gallery-thumb');
    expect(media?.classList.contains('ngx-image-gallery-origin-crop')).toBe(true);
    expect(media?.style.width).toBe('200px');
    expect(media?.style.height).toBe('150px');
    expect(media?.style.transform).toContain('translate3d(30px, 20px, 0) scale(1)');
    expect(thumb?.style.objectPosition).toBe('20% 80%');
  });

  it('keeps the uniform origin scale when cropped thumbnail handling is disabled', () => {
    const origin = createOriginElement({
      rect: { width: 200, height: 150, top: 20, left: 30 },
      objectFit: 'cover',
    });
    const frameCallbacks: FrameRequestCallback[] = [];
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      frameCallbacks.push(callback);
      return 1;
    };

    service.open(
      [
        {
          fullSrc: 'full-1.jpg',
          thumbSrc: 'thumb-1.jpg',
          width: 2400,
          height: 1600,
          thumbCropped: false,
        },
      ],
      0,
      { originElement: origin, originElements: [origin] },
    );

    const media = document.querySelector<HTMLDivElement>('.ngx-image-gallery-media');
    expect(media?.classList.contains('ngx-image-gallery-origin-crop')).toBe(false);
    expect(media?.style.width).toBe('960px');
    expect(media?.style.height).toBe('640px');
    expect(media?.style.transform).toContain(
      'translate3d(30px, 20px, 0) scale(0.20833333333333334)',
    );

    frameCallbacks[0]?.(0);

    expect(media?.style.transform).toContain('translate3d(32px, 64px, 0) scale(1)');
  });

  it('loads the full image only after a slide becomes active', () => {
    const origins = [createOriginElement(), createOriginElement()];

    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      0,
      { originElement: origins[0], originElements: origins },
    );

    vi.advanceTimersByTime(333);
    service.next();

    expect(FakeImage.requests).toEqual(['full-1.jpg']);

    vi.advanceTimersByTime(220);

    expect(service.activeIndex()).toBe(1);
    expect(FakeImage.requests).toEqual(['full-1.jpg', 'full-2.jpg']);
  });

  it('updates public state and removes the overlay on close', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0);

    expect(document.querySelector('.ngx-image-gallery-overlay')).toBeTruthy();
    expect(service.state()).toMatchObject({
      isOpen: true,
      activeIndex: 0,
    });

    service.close(false);

    expect(document.querySelector('.ngx-image-gallery-overlay')).toBeFalsy();
    expect(service.state()).toEqual({
      isOpen: false,
      activeIndex: -1,
      activeItem: null,
    });
  });

  it('adds configured classes to generated lightbox elements', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0, {
      classes: {
        overlay: 'tailwind-overlay',
        button: ['tailwind-button', 'rounded-full'],
        closeButton: 'tailwind-close',
        counter: 'tailwind-counter',
      },
    });

    expect(
      document.querySelector('.ngx-image-gallery-overlay')?.classList.contains('tailwind-overlay'),
    ).toBe(true);
    expect(
      document.querySelector('.ngx-image-gallery-close')?.classList.contains('tailwind-button'),
    ).toBe(true);
    expect(
      document.querySelector('.ngx-image-gallery-close')?.classList.contains('tailwind-close'),
    ).toBe(true);
    expect(
      document.querySelector('.ngx-image-gallery-counter')?.classList.contains('tailwind-counter'),
    ).toBe(true);
  });

  it('zooms around the selected point and keeps zooming in on repeated double-click', () => {
    FakeImage.naturalWidthValue = 6400;
    FakeImage.naturalHeightValue = 3200;
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 6400, height: 3200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const media = getMedia();

    stage.dispatchEvent(createMouseEvent('dblclick', { clientX: 512, clientY: 384 }));

    expect(media.style.transform).toBe('translate3d(-688px, -216px, 0) scale(2.5)');

    stage.dispatchEvent(createMouseEvent('dblclick', { clientX: 512, clientY: 384 }));

    expect(media.style.transform).toBe('translate3d(-1888px, -816px, 0) scale(5)');
  });

  it('zooms around the mouse wheel point', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const media = getMedia();
    const wheel = createWheelEvent({ clientX: 512, clientY: 384, deltaY: -120 });

    const wasNotPrevented = stage.dispatchEvent(wheel);

    expect(wasNotPrevented).toBe(false);
    expect(media.style.transform).toBe('translate3d(-88px, 84px, 0) scale(1.25)');
  });

  it('prevents native page zoom during touch pinch gestures', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const touchMove = createTouchEvent('touchmove', 2);

    const wasNotPrevented = stage.dispatchEvent(touchMove);

    expect(wasNotPrevented).toBe(false);
  });

  it('zooms the image around the touch pinch midpoint', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const media = getMedia();

    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 462, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 2, clientX: 562, clientY: 384 }),
    );
    const pinchMove = createPointerEvent('pointermove', {
      pointerId: 2,
      clientX: 612,
      clientY: 384,
    });

    const wasNotPrevented = stage.dispatchEvent(pinchMove);

    expect(wasNotPrevented).toBe(false);
    expect(media.style.transform).toBe('translate3d(-183px, 24px, 0) scale(1.5)');
  });

  it('does not force synchronous layout on every pinch update', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const media = getMedia();
    const readLayout = vi.spyOn(media, 'getBoundingClientRect');

    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 462, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 2, clientX: 562, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 2, clientX: 612, clientY: 384 }),
    );

    expect(readLayout).not.toHaveBeenCalled();
  });

  it('restores media transitions after an interactive pinch gesture', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const media = getMedia();

    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 462, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 2, clientX: 562, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 2, clientX: 612, clientY: 384 }),
    );

    expect(media.style.transition).toBe('none');

    stage.dispatchEvent(
      createPointerEvent('pointerup', { pointerId: 1, clientX: 462, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointerup', { pointerId: 2, clientX: 612, clientY: 384 }),
    );

    expect(media.style.transition).toBe('');
  });
});

interface OriginElementOptions {
  rect?: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  objectFit?: string;
  objectPosition?: string;
}

function createOriginElement(options: OriginElementOptions = {}): HTMLElement {
  const rect = options.rect ?? { width: 200, height: 100, top: 20, left: 30 };
  const origin = document.createElement('a');
  Object.defineProperty(origin, 'getBoundingClientRect', {
    value: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    }),
  });
  if (options.objectFit || options.objectPosition) {
    const image = document.createElement('img');
    image.style.objectFit = options.objectFit ?? '';
    image.style.objectPosition = options.objectPosition ?? '';
    origin.appendChild(image);
  }
  document.body.appendChild(origin);
  return origin;
}

function getStage(): HTMLDivElement {
  const stage = document.querySelector<HTMLDivElement>('.ngx-image-gallery-stage');
  if (!stage) {
    throw new Error('Expected gallery stage to exist');
  }
  return stage;
}

function getMedia(): HTMLDivElement {
  const media = document.querySelector<HTMLDivElement>('.ngx-image-gallery-media');
  if (!media) {
    throw new Error('Expected gallery media to exist');
  }
  return media;
}

function createMouseEvent(
  eventName: string,
  options: Pick<MouseEventInit, 'clientX' | 'clientY'>,
): MouseEvent {
  return new MouseEvent(eventName, {
    ...options,
    bubbles: true,
    cancelable: true,
  });
}

function createWheelEvent(
  options: Pick<WheelEventInit, 'clientX' | 'clientY' | 'deltaY'>,
): WheelEvent {
  return new WheelEvent('wheel', {
    ...options,
    bubbles: true,
    cancelable: true,
  });
}

function createPointerEvent(
  eventName: string,
  options: { pointerId: number; clientX: number; clientY: number },
): PointerEvent {
  const event = new Event(eventName, {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperties(event, {
    pointerId: { value: options.pointerId },
    clientX: { value: options.clientX },
    clientY: { value: options.clientY },
  });
  return event as PointerEvent;
}

function createTouchEvent(eventName: string, touchCount: number): Event {
  const event = new Event(eventName, {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'touches', {
    value: Array.from({ length: touchCount }, () => ({})),
  });
  return event;
}
