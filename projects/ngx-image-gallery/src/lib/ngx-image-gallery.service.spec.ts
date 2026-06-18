import {
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import {
  provideNgxImageGallery,
  type NgxImageGalleryItem,
  type NgxImageGalleryItemContentContext,
} from './gallery-types';

let destroyedCustomContentCount = 0;

@Component({
  selector: 'app-custom-content-destroy-marker',
  template: '<span id="custom-destroy-marker">custom marker</span>',
})
class CustomContentDestroyMarker implements OnDestroy {
  ngOnDestroy(): void {
    destroyedCustomContentCount += 1;
  }
}

@Component({
  imports: [CustomContentDestroyMarker],
  template: `
    <ng-template #content let-item let-index="index" let-gallery="gallery">
      <app-custom-content-destroy-marker />
      <button id="custom-content-button" type="button" (click)="gallery.next()">
        {{ item.alt }} {{ index }}
      </button>
      <input id="custom-content-input" />
    </ng-template>
  `,
})
class ServiceItemContentHostComponent {
  readonly viewContainerRef = inject(ViewContainerRef);

  @ViewChild('content', { static: true })
  content!: TemplateRef<NgxImageGalleryItemContentContext>;
}

class FakeImage {
  static requests: string[] = [];
  static srcsets: string[] = [];
  static naturalWidthValue = 2400;
  static naturalHeightValue = 1200;
  static shouldError = false;

  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = FakeImage.naturalWidthValue;
  naturalHeight = FakeImage.naturalHeightValue;
  width = FakeImage.naturalWidthValue;
  height = FakeImage.naturalHeightValue;
  currentSrc = '';
  sizes = '';

  private source = '';
  private sourceSet = '';

  get src(): string {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
    this.currentSrc = value;
    FakeImage.requests.push(value);
    window.setTimeout(() => {
      if (FakeImage.shouldError) {
        this.onerror?.();
        return;
      }

      this.onload?.();
    }, 0);
  }

  get srcset(): string {
    return this.sourceSet;
  }

  set srcset(value: string) {
    this.sourceSet = value;
    FakeImage.srcsets.push(value);
  }
}

describe('NgxImageGalleryService', () => {
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeImage.requests = [];
    FakeImage.srcsets = [];
    FakeImage.naturalWidthValue = 2400;
    FakeImage.naturalHeightValue = 1200;
    FakeImage.shouldError = false;
    destroyedCustomContentCount = 0;
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

  it('renders custom item content without loading an image for that slide', () => {
    const fixture = TestBed.createComponent(ServiceItemContentHostComponent);
    fixture.detectChanges();
    const items: NgxImageGalleryItem[] = [
      { thumbSrc: 'custom-thumb.jpg', alt: 'Custom card', data: { kind: 'card' } },
      { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg', alt: 'Second image' },
    ];

    service.open(items, 0, {
      itemContentTemplates: [
        {
          templateRef: fixture.componentInstance.content,
          viewContainerRef: fixture.componentInstance.viewContainerRef,
        },
      ],
    });
    vi.advanceTimersByTime(333);

    expect(document.querySelector('#custom-content-button')?.textContent?.trim()).toBe(
      'Custom card 0',
    );
    expect(FakeImage.requests).toEqual([]);
    expect(document.querySelector('.ngx-image-gallery-loading')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(document.querySelector('.ngx-image-gallery-error')?.getAttribute('aria-hidden')).toBe(
      'true',
    );

    document.querySelector<HTMLButtonElement>('#custom-content-button')?.click();
    vi.advanceTimersByTime(220);

    expect(service.activeIndex()).toBe(1);
    expect(FakeImage.requests).toEqual(['full-2.jpg']);
  });

  it('destroys custom item content views when slides rerender and when the lightbox closes', () => {
    const fixture = TestBed.createComponent(ServiceItemContentHostComponent);
    fixture.detectChanges();
    const items: NgxImageGalleryItem[] = [
      { thumbSrc: 'custom-thumb-1.jpg', alt: 'First custom card' },
      { thumbSrc: 'custom-thumb-2.jpg', alt: 'Second custom card' },
    ];
    const itemContentTemplate = {
      templateRef: fixture.componentInstance.content,
      viewContainerRef: fixture.componentInstance.viewContainerRef,
    };
    const itemContentTemplates = [itemContentTemplate, itemContentTemplate];

    service.open(items, 0, { itemContentTemplates });
    vi.advanceTimersByTime(333);

    expect(document.querySelectorAll('#custom-destroy-marker')).toHaveLength(3);

    service.next();
    vi.advanceTimersByTime(220);

    expect(destroyedCustomContentCount).toBe(3);

    service.close(false);

    expect(destroyedCustomContentCount).toBe(6);
  });

  it('includes custom item content controls in focus trapping without hijacking editable keys', () => {
    const fixture = TestBed.createComponent(ServiceItemContentHostComponent);
    fixture.detectChanges();

    service.open([{ thumbSrc: 'custom-thumb.jpg', alt: 'Custom card' }], 0, {
      itemContentTemplates: [
        {
          templateRef: fixture.componentInstance.content,
          viewContainerRef: fixture.componentInstance.viewContainerRef,
        },
      ],
    });
    vi.advanceTimersByTime(333);

    const button = document.querySelector<HTMLButtonElement>('#custom-content-button');
    const input = document.querySelector<HTMLInputElement>('#custom-content-input');
    button?.focus();

    document.dispatchEvent(createKeyboardEvent('Tab'));

    expect(document.activeElement).toBe(input);

    const keydown = createKeyboardEvent('ArrowRight');
    input?.dispatchEvent(keydown);
    vi.advanceTimersByTime(220);

    expect(keydown.defaultPrevented).toBe(false);
    expect(service.activeIndex()).toBe(0);
  });

  it('does not capture pointer gestures that start inside custom item content', () => {
    const fixture = TestBed.createComponent(ServiceItemContentHostComponent);
    fixture.detectChanges();

    service.open([{ thumbSrc: 'custom-thumb.jpg', alt: 'Custom card' }], 0, {
      itemContentTemplates: [
        {
          templateRef: fixture.componentInstance.content,
          viewContainerRef: fixture.componentInstance.viewContainerRef,
        },
      ],
    });
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const content = document.querySelector<HTMLElement>('.ngx-image-gallery-content');
    stage.setPointerCapture = vi.fn();

    content?.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 120, clientY: 160 }),
    );
    const pointerMove = createPointerEvent('pointermove', {
      pointerId: 1,
      clientX: 220,
      clientY: 160,
    });
    const wasNotPrevented = content?.dispatchEvent(pointerMove);

    expect(stage.setPointerCapture).not.toHaveBeenCalled();
    expect(wasNotPrevented).toBe(true);
    expect(pointerMove.defaultPrevented).toBe(false);
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

  it('defaults invalid open indexes to the first slide', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      Number.NaN,
    );

    expect(service.activeIndex()).toBe(0);
    expect(service.activeItem()?.fullSrc).toBe('full-1.jpg');
  });

  it('ignores invalid goTo indexes', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      0,
    );
    vi.advanceTimersByTime(333);

    service.goTo(Number.NaN);
    service.goTo(Number.POSITIVE_INFINITY);

    expect(service.activeIndex()).toBe(0);
    expect(service.activeItem()?.fullSrc).toBe('full-1.jpg');
  });

  it('removes a closing overlay before opening another gallery', () => {
    service.open([{ fullSrc: 'old-full.jpg', thumbSrc: 'old-thumb.jpg' }], 0);
    vi.advanceTimersByTime(333);

    service.close();
    service.open([{ fullSrc: 'new-full.jpg', thumbSrc: 'new-thumb.jpg' }], 0);

    expect(document.querySelectorAll('.ngx-image-gallery-overlay')).toHaveLength(1);
    expect(getRenderedImageSources()).toContain('new-thumb.jpg');
    expect(getRenderedImageSources()).not.toContain('old-thumb.jpg');

    vi.advanceTimersByTime(333);

    expect(document.querySelectorAll('.ngx-image-gallery-overlay')).toHaveLength(1);
  });

  it('gives the dialog an accessible name', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0);

    const overlay = document.querySelector('.ngx-image-gallery-overlay');

    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(overlay?.getAttribute('aria-label')).toBe('Image gallery');
  });

  it('uses configured labels without replacing unspecified defaults', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', alt: 'First image' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg', alt: 'Second image' },
      ],
      1,
      {
        showThumbnails: true,
        labels: {
          dialog: 'Photo gallery',
          closeButton: 'Close photo gallery',
          counter: (current, total) => `Photo ${current} of ${total}`,
          thumbnailButton: (item, index, total) =>
            `Open photo ${index + 1} of ${total}: ${item.alt}`,
          loading: 'Loading photo',
        },
      },
    );

    expect(document.querySelector('.ngx-image-gallery-overlay')?.getAttribute('aria-label')).toBe(
      'Photo gallery',
    );
    expect(document.querySelector('.ngx-image-gallery-close')?.getAttribute('aria-label')).toBe(
      'Close photo gallery',
    );
    expect(document.querySelector('.ngx-image-gallery-next')?.getAttribute('aria-label')).toBe(
      'Next image',
    );
    expect(document.querySelector('.ngx-image-gallery-counter')?.textContent).toBe('Photo 2 of 2');
    expect(document.querySelector('.ngx-image-gallery-loading')?.textContent).toBe('Loading photo');
    expect(
      document
        .querySelectorAll<HTMLButtonElement>('.ngx-image-gallery-thumbnail')[1]
        ?.getAttribute('aria-label'),
    ).toBe('Open photo 2 of 2: Second image');
  });

  it('does not assign unsafe image source schemes to generated images or the loader', () => {
    service.open(
      [
        {
          fullSrc: 'javascript:alert(1)',
          thumbSrc: 'data:text/html,<script>alert(1)</script>',
        },
      ],
      0,
      { showThumbnails: true },
    );

    expect(getRenderedImageSources()).toEqual(['']);

    vi.advanceTimersByTime(333);

    expect(FakeImage.requests).toEqual([]);
    expect(document.querySelector('.ngx-image-gallery-error')?.getAttribute('aria-hidden')).toBe(
      'false',
    );
  });

  it('drops unsafe srcset candidates before loading the full image', () => {
    service.open(
      [
        {
          fullSrc: 'full-1.jpg',
          thumbSrc: 'thumb-1.jpg',
          srcset: 'full-1.jpg 1x, javascript:alert(1) 2x',
        },
      ],
      0,
    );

    vi.advanceTimersByTime(333);

    expect(FakeImage.requests).toEqual(['full-1.jpg']);
    expect(FakeImage.srcsets).toEqual([]);
  });

  it('drops data image srcset candidates before loading the full image', () => {
    service.open(
      [
        {
          fullSrc: 'full-1.jpg',
          thumbSrc: 'thumb-1.jpg',
          srcset: 'data:image/png;base64,iVBORw0KGgo= 1x',
        },
      ],
      0,
    );

    vi.advanceTimersByTime(333);

    expect(FakeImage.requests).toEqual(['full-1.jpg']);
    expect(FakeImage.srcsets).toEqual([]);
  });

  it('moves focus into the dialog, traps it, and restores connected origin focus', () => {
    const opener = document.createElement('button');
    opener.type = 'button';
    document.body.appendChild(opener);
    opener.focus();

    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      0,
    );
    vi.advanceTimersByTime(333);

    const closeButton = document.querySelector<HTMLButtonElement>('.ngx-image-gallery-close');
    const previousButton = document.querySelector<HTMLButtonElement>('.ngx-image-gallery-prev');

    expect(document.activeElement).toBe(closeButton);

    document.dispatchEvent(createKeyboardEvent('Tab'));
    expect(document.activeElement).toBe(previousButton);

    document.dispatchEvent(createKeyboardEvent('Tab', { shiftKey: true }));
    expect(document.activeElement).toBe(closeButton);

    service.close(false);

    expect(document.activeElement).toBe(opener);
  });

  it('marks body siblings inert while the dialog is open and restores them on close', () => {
    const page = document.createElement('main');
    page.setAttribute('aria-hidden', 'false');
    document.body.appendChild(page);
    document.body.style.overflow = 'auto';

    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0);

    expect(document.body.style.overflow).toBe('hidden');
    expect(page.hasAttribute('inert')).toBe(true);
    expect(page.getAttribute('aria-hidden')).toBe('true');

    service.close(false);

    expect(document.body.style.overflow).toBe('auto');
    expect(page.hasAttribute('inert')).toBe(false);
    expect(page.getAttribute('aria-hidden')).toBe('false');
  });

  it('does not restore focus to a disconnected origin element', () => {
    const opener = document.createElement('button');
    opener.type = 'button';
    document.body.appendChild(opener);
    opener.focus();

    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0);
    vi.advanceTimersByTime(333);
    opener.remove();

    expect(() => service.close(false)).not.toThrow();
    expect(document.activeElement).not.toBe(opener);
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

  it('does not render lightbox thumbnails by default', () => {
    service.open([
      { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
      { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
    ]);

    expect(document.querySelector('.ngx-image-gallery-thumbnails')).toBeFalsy();
  });

  it('renders configured thumbnail classes when lightbox thumbnails are enabled', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      0,
      {
        showThumbnails: true,
        classes: {
          thumbnails: 'tailwind-thumbnails',
          thumbnailButton: 'tailwind-thumbnail-button',
          thumbnailImage: 'tailwind-thumbnail-image',
        },
      },
    );

    expect(
      document
        .querySelector('.ngx-image-gallery-thumbnails')
        ?.classList.contains('tailwind-thumbnails'),
    ).toBe(true);
    expect(
      document
        .querySelector('.ngx-image-gallery-thumbnail')
        ?.classList.contains('tailwind-thumbnail-button'),
    ).toBe(true);
    expect(
      document
        .querySelector('.ngx-image-gallery-thumbnail-image')
        ?.classList.contains('tailwind-thumbnail-image'),
    ).toBe(true);
  });

  it('opens clicked lightbox thumbnails by index', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', alt: 'First image' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg', alt: 'Second image' },
        { fullSrc: 'full-3.jpg', thumbSrc: 'thumb-3.jpg', alt: 'Third image' },
      ],
      0,
      { showThumbnails: true },
    );
    vi.advanceTimersByTime(333);

    const thumbnails = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.ngx-image-gallery-thumbnail'),
    );
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails[0]?.classList.contains('ngx-image-gallery-thumbnail-active')).toBe(true);
    expect(thumbnails[0]?.getAttribute('aria-current')).toBe('true');
    expect(thumbnails[2]?.getAttribute('aria-label')).toBe('Show image 3: Third image');

    thumbnails[2]?.dispatchEvent(createMouseEvent('click', { clientX: 0, clientY: 0 }));
    vi.advanceTimersByTime(220);

    expect(service.activeIndex()).toBe(2);
    expect(thumbnails[2]?.classList.contains('ngx-image-gallery-thumbnail-active')).toBe(true);
    expect(thumbnails[2]?.getAttribute('aria-current')).toBe('true');
  });

  it('hides inactive slides from assistive technology and labels the active slide', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', alt: 'First image' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg', alt: 'Second image' },
        { fullSrc: 'full-3.jpg', thumbSrc: 'thumb-3.jpg', alt: 'Third image' },
      ],
      1,
    );

    const currentSlide = document.querySelector<HTMLElement>('.ngx-image-gallery-slide-current');
    const hiddenSlides = document.querySelectorAll<HTMLElement>(
      '.ngx-image-gallery-slide-prev, .ngx-image-gallery-slide-next',
    );

    expect(currentSlide?.getAttribute('role')).toBe('group');
    expect(currentSlide?.getAttribute('aria-roledescription')).toBe('slide');
    expect(currentSlide?.getAttribute('aria-hidden')).toBeNull();
    expect(currentSlide?.getAttribute('aria-label')).toBe('2 / 3: Second image');
    hiddenSlides.forEach((slide) => expect(slide.getAttribute('aria-hidden')).toBe('true'));
  });

  it('announces loading and error states only when they are active', async () => {
    FakeImage.shouldError = true;

    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' }], 0, {
      labels: {
        loading: 'Loading custom image',
        error: 'Custom image error',
      },
    });
    vi.advanceTimersByTime(333);

    const loading = document.querySelector<HTMLElement>('.ngx-image-gallery-loading');
    const error = document.querySelector<HTMLElement>('.ngx-image-gallery-error');

    expect(loading?.getAttribute('role')).toBe('status');
    expect(loading?.getAttribute('aria-hidden')).toBe('false');
    expect(loading?.textContent).toBe('Loading custom image');
    expect(error?.getAttribute('aria-hidden')).toBe('true');

    await vi.runOnlyPendingTimersAsync();

    expect(loading?.getAttribute('aria-hidden')).toBe('true');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.getAttribute('aria-hidden')).toBe('false');
    expect(error?.textContent).toBe('Custom image error');
  });

  it('jumps directly to non-adjacent thumbnails instead of animating through the next slide', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
        { fullSrc: 'full-3.jpg', thumbSrc: 'thumb-3.jpg' },
        { fullSrc: 'full-4.jpg', thumbSrc: 'thumb-4.jpg' },
      ],
      0,
      { showThumbnails: true },
    );
    vi.advanceTimersByTime(333);

    const thumbnails = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.ngx-image-gallery-thumbnail'),
    );
    thumbnails[2]?.dispatchEvent(createMouseEvent('click', { clientX: 0, clientY: 0 }));

    expect(service.activeIndex()).toBe(2);
    expect(
      document
        .querySelector<HTMLImageElement>(
          '.ngx-image-gallery-slide-current .ngx-image-gallery-thumb',
        )
        ?.getAttribute('src'),
    ).toBe('thumb-3.jpg');
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

  it('supports keyboard zoom controls and reset', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const media = getMedia();

    document.dispatchEvent(createKeyboardEvent('+'));

    expect(media.style.transform).toContain('scale(1.25)');

    document.dispatchEvent(createKeyboardEvent('-'));

    expect(media.style.transform).toContain('scale(1)');

    document.dispatchEvent(createKeyboardEvent('='));
    expect(media.style.transform).toContain('scale(1.25)');

    document.dispatchEvent(createKeyboardEvent('0'));

    expect(media.style.transform).toContain('scale(1)');
  });

  it('does not run global gallery shortcuts from editable fields', () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg' },
      ],
      0,
    );
    vi.advanceTimersByTime(333);

    const input = document.createElement('input');
    document.querySelector('.ngx-image-gallery-custom-ui')?.appendChild(input);
    input.focus();

    const keydown = createKeyboardEvent('ArrowRight');
    input.dispatchEvent(keydown);
    vi.advanceTimersByTime(220);

    expect(keydown.defaultPrevented).toBe(false);
    expect(service.activeIndex()).toBe(0);
  });

  it('pans the zoomed image opposite to mouse cursor movement', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    const media = getMedia();

    stage.dispatchEvent(createMouseEvent('dblclick', { clientX: 512, clientY: 384 }));
    stage.dispatchEvent(
      createPointerEvent('pointermove', { pointerId: 1, clientX: 512, clientY: 768 }),
    );

    expect(media.style.transform).toBe('translate3d(-688px, -432px, 0) scale(2.5)');
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

  it('does not release pointer capture after the browser already released it', () => {
    service.open([{ fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', width: 2400, height: 1200 }]);
    vi.advanceTimersByTime(333);

    const stage = getStage();
    stage.setPointerCapture = vi.fn();
    stage.hasPointerCapture = vi.fn(() => false);
    stage.releasePointerCapture = vi.fn(() => {
      throw new DOMException('Pointer is not captured', 'NotFoundError');
    });

    stage.dispatchEvent(
      createPointerEvent('pointerdown', { pointerId: 1, clientX: 462, clientY: 384 }),
    );
    stage.dispatchEvent(
      createPointerEvent('pointercancel', { pointerId: 1, clientX: 462, clientY: 384 }),
    );

    expect(stage.releasePointerCapture).not.toHaveBeenCalled();
  });

  it('passes an automated accessibility smoke check for the default lightbox', async () => {
    service.open(
      [
        { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', alt: 'First image' },
        { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg', alt: 'Second image' },
      ],
      0,
      { showThumbnails: true },
    );
    vi.advanceTimersByTime(333);
    vi.useRealTimers();

    const results = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
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

function getRenderedImageSources(): string[] {
  return Array.from(document.querySelectorAll<HTMLImageElement>('.ngx-image-gallery-image')).map(
    (image) => image.getAttribute('src') ?? '',
  );
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

function createKeyboardEvent(
  key: string,
  options: Pick<KeyboardEventInit, 'shiftKey'> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    ...options,
    key,
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
