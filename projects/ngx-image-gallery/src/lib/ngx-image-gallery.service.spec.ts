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
