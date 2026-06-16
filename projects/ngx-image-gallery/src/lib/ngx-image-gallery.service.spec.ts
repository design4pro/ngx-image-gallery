import { TestBed } from '@angular/core/testing';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import { provideNgxImageGallery } from './gallery-types';

class FakeImage {
  static requests: string[] = [];

  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 2400;
  naturalHeight = 1200;
  width = 2400;
  height = 1200;
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

function createOriginElement(): HTMLElement {
  const origin = document.createElement('a');
  Object.defineProperty(origin, 'getBoundingClientRect', {
    value: () => ({ width: 200, height: 100, top: 20, left: 30, right: 230, bottom: 120 }),
  });
  document.body.appendChild(origin);
  return origin;
}
