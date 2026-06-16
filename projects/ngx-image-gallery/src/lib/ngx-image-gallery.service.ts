import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  NgZone,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  type EmbeddedViewRef,
} from '@angular/core';
import {
  calculateZoomBounds,
  calculateZoomPanForPoint,
  clamp,
  clampPan,
  fitIntoViewport,
  findImageElement,
  getImageSource,
  getNextZoomScale,
  getScaledOrigin,
  resolveImageDimensions,
  type GalleryPoint,
  type GalleryRect,
  type GallerySize,
  type ResolvedDimensions,
  type ZoomBounds,
} from './gallery-geometry';
import { GALLERY_STYLE_ID, GALLERY_STYLES } from './gallery-styles';
import {
  DEFAULT_NGX_IMAGE_GALLERY_OPTIONS,
  NGX_IMAGE_GALLERY_OPTIONS,
  type NgxImageGalleryClassValue,
  type NgxImageGalleryItem,
  type NgxImageGalleryLightboxContext,
  type NgxImageGalleryOpenOptions,
  type NgxImageGalleryOptions,
  type NgxImageGalleryState,
} from './gallery-types';
import { BrowserImageLoader, type ImageLoader, type LoadedImage } from './image-loader';

interface RenderedSlideElements {
  slide: HTMLDivElement;
  media: HTMLDivElement;
  thumbImage: HTMLImageElement;
  fullImage: HTMLImageElement | null;
}

interface SlideRuntime {
  item: NgxImageGalleryItem;
  index: number;
  originElement?: HTMLElement;
  dimensions: ResolvedDimensions;
  thumbSrc: string;
  fitted: GalleryRect;
  zoomBounds: ZoomBounds;
  zoomScale: number;
  pan: GalleryPoint;
  userZoomed: boolean;
  fullLoaded: boolean;
  fullLoading: boolean;
  fullError: boolean;
  fullSrc: string | null;
  elements: RenderedSlideElements | null;
}

interface OverlayElements {
  overlay: HTMLDivElement;
  backdrop: HTMLDivElement;
  stage: HTMLDivElement;
  track: HTMLDivElement;
  ui: HTMLDivElement;
  defaultUi: HTMLDivElement;
  customUi: HTMLDivElement;
  closeButton: HTMLButtonElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  counter: HTMLDivElement;
  loading: HTMLDivElement;
  error: HTMLDivElement;
}

interface CustomLightboxRuntime {
  viewRef: EmbeddedViewRef<NgxImageGalleryLightboxContext>;
  context: NgxImageGalleryLightboxContext;
}

interface PointerGesture {
  mode: 'swipe' | 'pan' | 'pinch';
  startX: number;
  startY: number;
  lastX: number;
  startPan: GalleryPoint;
  startZoomScale: number;
  startDistance: number;
  startCenter: GalleryPoint;
}

interface GalleryRuntime {
  items: NgxImageGalleryItem[];
  options: NgxImageGalleryOptions;
  slides: SlideRuntime[];
  activeIndex: number;
  viewport: GallerySize;
  elements: OverlayElements;
  previousFocus: HTMLElement | null;
  isOpening: boolean;
  isClosing: boolean;
  isNavigating: boolean;
  cleanup: Array<() => void>;
  pointers: Map<number, GalleryPoint>;
  gesture: PointerGesture | null;
  openTimer: number | null;
  mediaFrame: number | null;
  customLightbox: CustomLightboxRuntime | null;
}

const ANIMATION_DURATION_MS = 333;
const NAVIGATION_DURATION_MS = 220;
const SWIPE_THRESHOLD_PX = 60;
const VIEWPORT_PADDING_PX = 32;
const ORIGIN_RATIO_TOLERANCE = 0.01;
const WHEEL_ZOOM_FACTOR = 1.25;

interface OriginCrop {
  objectPosition: string;
}

@Injectable({ providedIn: 'root' })
export class NgxImageGalleryService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly defaultOptions = inject(NGX_IMAGE_GALLERY_OPTIONS);
  private readonly imageLoader: ImageLoader = new BrowserImageLoader();
  private readonly stateSignal = signal<NgxImageGalleryState>({
    isOpen: false,
    activeIndex: -1,
    activeItem: null,
  });

  private runtime: GalleryRuntime | null = null;

  readonly state = this.stateSignal.asReadonly();
  readonly isOpen = computed(() => this.stateSignal().isOpen);
  readonly activeIndex = computed(() => this.stateSignal().activeIndex);
  readonly activeItem = computed(() => this.stateSignal().activeItem);

  open(
    items: readonly NgxImageGalleryItem[],
    index = 0,
    options: NgxImageGalleryOpenOptions = {},
  ): void {
    if (!isPlatformBrowser(this.platformId) || items.length === 0) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.close(false);
      this.ensureStyles();

      const galleryItems = items.map((item) => ({ ...item }));
      const mergedOptions = this.mergeOptions(options);
      const activeIndex = clamp(Math.trunc(index), 0, galleryItems.length - 1);
      const originElements = options.originElements ?? [];
      const slides = galleryItems.map((item, slideIndex) =>
        this.createSlideRuntime(
          item,
          slideIndex,
          originElements[slideIndex] ??
            (slideIndex === activeIndex ? options.originElement : undefined),
          mergedOptions,
        ),
      );
      const elements = this.createOverlayElements(mergedOptions);
      const runtime: GalleryRuntime = {
        items: galleryItems,
        options: mergedOptions,
        slides,
        activeIndex,
        viewport: this.getViewportSize(),
        elements,
        previousFocus:
          this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null,
        isOpening: true,
        isClosing: false,
        isNavigating: false,
        cleanup: [],
        pointers: new Map<number, GalleryPoint>(),
        gesture: null,
        openTimer: null,
        mediaFrame: null,
        customLightbox: null,
      };
      runtime.customLightbox = this.createCustomLightbox(runtime, options);

      this.runtime = runtime;
      this.document.body.appendChild(elements.overlay);
      this.bindOverlayEvents(runtime);
      this.renderVisibleSlides(runtime);
      this.updateState(runtime);
      this.startOpeningAnimation(runtime);
    });
  }

  close(animate = true): void {
    const runtime = this.runtime;
    if (!runtime || runtime.isClosing) {
      return;
    }

    runtime.isClosing = true;
    runtime.isOpening = false;
    if (runtime.openTimer !== null) {
      window.clearTimeout(runtime.openTimer);
      runtime.openTimer = null;
    }

    const finish = () => this.destroyRuntime(runtime);
    if (!animate) {
      finish();
      return;
    }

    const activeSlide = this.getActiveSlide(runtime);
    runtime.elements.overlay.classList.remove('ngx-image-gallery-open');
    if (activeSlide?.elements && activeSlide.originElement) {
      this.applyOriginTransform(activeSlide);
    }

    window.setTimeout(finish, ANIMATION_DURATION_MS);
  }

  next(): void {
    this.navigateBy(1);
  }

  previous(): void {
    this.navigateBy(-1);
  }

  goTo(index: number): void {
    const runtime = this.runtime;
    if (!runtime) {
      return;
    }

    const normalized = this.normalizeIndex(runtime, index);
    if (normalized === null || normalized === runtime.activeIndex) {
      return;
    }

    this.navigateBy(normalized > runtime.activeIndex ? 1 : -1);
  }

  private mergeOptions(options: Partial<NgxImageGalleryOptions>): NgxImageGalleryOptions {
    return {
      ...DEFAULT_NGX_IMAGE_GALLERY_OPTIONS,
      ...this.defaultOptions,
      ...options,
      classes: {
        ...DEFAULT_NGX_IMAGE_GALLERY_OPTIONS.classes,
        ...this.defaultOptions.classes,
        ...options.classes,
      },
      loadOriginal: 'after-open',
    };
  }

  private createSlideRuntime(
    item: NgxImageGalleryItem,
    index: number,
    originElement: HTMLElement | undefined,
    options: NgxImageGalleryOptions,
  ): SlideRuntime {
    const dimensions = resolveImageDimensions(item, originElement, options.provisionalLongEdge);
    const fitted = fitIntoViewport(dimensions, this.getViewportSize(), VIEWPORT_PADDING_PX);

    return {
      item,
      index,
      originElement,
      dimensions,
      thumbSrc: getImageSource(item, originElement),
      fitted,
      zoomBounds: calculateZoomBounds(dimensions, fitted),
      zoomScale: 1,
      pan: { x: 0, y: 0 },
      userZoomed: false,
      fullLoaded: false,
      fullLoading: false,
      fullError: false,
      fullSrc: null,
      elements: null,
    };
  }

  private ensureStyles(): void {
    if (this.document.getElementById(GALLERY_STYLE_ID)) {
      return;
    }

    const style = this.document.createElement('style');
    style.id = GALLERY_STYLE_ID;
    style.textContent = GALLERY_STYLES;
    this.document.head.appendChild(style);
  }

  private createOverlayElements(options: NgxImageGalleryOptions): OverlayElements {
    const overlay = this.document.createElement('div');
    overlay.className = 'ngx-image-gallery-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    this.addClassNames(overlay, options.classes.overlay);

    const backdrop = this.document.createElement('div');
    backdrop.className = 'ngx-image-gallery-backdrop';
    this.addClassNames(backdrop, options.classes.backdrop);

    const stage = this.document.createElement('div');
    stage.className = 'ngx-image-gallery-stage';
    stage.tabIndex = -1;
    this.addClassNames(stage, options.classes.stage);

    const track = this.document.createElement('div');
    track.className = 'ngx-image-gallery-track';
    this.addClassNames(track, options.classes.track);

    const ui = this.document.createElement('div');
    ui.className = 'ngx-image-gallery-ui';
    this.addClassNames(ui, options.classes.ui);

    const defaultUi = this.document.createElement('div');
    defaultUi.className = 'ngx-image-gallery-default-ui';
    this.addClassNames(defaultUi, options.classes.defaultUi);

    const customUi = this.document.createElement('div');
    customUi.className = 'ngx-image-gallery-custom-ui';
    this.addClassNames(customUi, options.classes.customUi);

    const closeButton = this.createButton(
      'ngx-image-gallery-close',
      'Close gallery',
      '\u00d7',
      options.classes.button,
      options.classes.closeButton,
    );
    const prevButton = this.createButton(
      'ngx-image-gallery-prev',
      'Previous image',
      '\u2039',
      options.classes.button,
      options.classes.previousButton,
    );
    const nextButton = this.createButton(
      'ngx-image-gallery-next',
      'Next image',
      '\u203a',
      options.classes.button,
      options.classes.nextButton,
    );

    const counter = this.document.createElement('div');
    counter.className = 'ngx-image-gallery-counter';
    counter.setAttribute('aria-live', 'polite');
    this.addClassNames(counter, options.classes.counter);

    const loading = this.document.createElement('div');
    loading.className = 'ngx-image-gallery-loading';
    loading.textContent = 'Loading image';
    this.addClassNames(loading, options.classes.loading);

    const error = this.document.createElement('div');
    error.className = 'ngx-image-gallery-error';
    error.textContent = 'Image could not be loaded';
    this.addClassNames(error, options.classes.error);

    defaultUi.append(counter, closeButton, prevButton, nextButton, loading, error);
    ui.append(defaultUi, customUi);
    stage.appendChild(track);
    overlay.append(backdrop, stage, ui);

    return {
      overlay,
      backdrop,
      stage,
      track,
      ui,
      defaultUi,
      customUi,
      closeButton,
      prevButton,
      nextButton,
      counter,
      loading,
      error,
    };
  }

  private createButton(
    className: string,
    label: string,
    text: string,
    ...classValues: NgxImageGalleryClassValue[]
  ): HTMLButtonElement {
    const button = this.document.createElement('button');
    const icon = this.document.createElement('span');
    button.type = 'button';
    button.className = `ngx-image-gallery-button ${className}`;
    button.setAttribute('aria-label', label);
    icon.className = 'ngx-image-gallery-button-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = text;
    button.appendChild(icon);
    classValues.forEach((classValue) => this.addClassNames(button, classValue));
    return button;
  }

  private addClassNames(element: HTMLElement, classValue: NgxImageGalleryClassValue): void {
    if (!classValue) {
      return;
    }

    const values = Array.isArray(classValue) ? classValue : [classValue];
    const tokens = values.flatMap((value) => value.split(/\s+/)).filter(Boolean);
    if (tokens.length > 0) {
      element.classList.add(...tokens);
    }
  }

  private createCustomLightbox(
    runtime: GalleryRuntime,
    options: NgxImageGalleryOpenOptions,
  ): CustomLightboxRuntime | null {
    if (!options.lightboxTemplate || !options.lightboxViewContainer) {
      return null;
    }

    runtime.elements.defaultUi.hidden = true;
    const context = this.createLightboxContext(runtime);
    const viewRef = options.lightboxViewContainer.createEmbeddedView(
      options.lightboxTemplate,
      context,
    );
    viewRef.detectChanges();

    viewRef.rootNodes.forEach((node: unknown) => {
      if (node instanceof Node) {
        runtime.elements.customUi.appendChild(node);
      }
    });

    return {
      viewRef,
      context,
    };
  }

  private createLightboxContext(runtime: GalleryRuntime): NgxImageGalleryLightboxContext {
    const context: NgxImageGalleryLightboxContext = {
      $implicit: null as unknown as NgxImageGalleryLightboxContext,
      state: this.stateSignal(),
      items: runtime.items,
      activeItem: null,
      activeIndex: runtime.activeIndex,
      count: runtime.items.length,
      isOpen: true,
      canGoPrevious: false,
      canGoNext: false,
      isLoading: false,
      hasError: false,
      close: () => this.close(),
      previous: () => this.previous(),
      next: () => this.next(),
      goTo: (index: number) => this.goTo(index),
    };

    this.updateLightboxContext(runtime, context);
    return context;
  }

  private updateCustomLightbox(runtime: GalleryRuntime): void {
    if (!runtime.customLightbox) {
      return;
    }

    this.updateLightboxContext(runtime, runtime.customLightbox.context);
    runtime.customLightbox.viewRef.detectChanges();
  }

  private updateLightboxContext(
    runtime: GalleryRuntime,
    context: NgxImageGalleryLightboxContext,
  ): void {
    const activeSlide = this.getActiveSlide(runtime);
    const activeItem = runtime.items[runtime.activeIndex] ?? null;
    const state: NgxImageGalleryState = {
      isOpen: true,
      activeIndex: runtime.activeIndex,
      activeItem,
    };

    context.$implicit = context;
    context.state = state;
    context.items = runtime.items;
    context.activeItem = activeItem;
    context.activeIndex = runtime.activeIndex;
    context.count = runtime.items.length;
    context.isOpen = true;
    context.canGoPrevious = this.normalizeIndex(runtime, runtime.activeIndex - 1) !== null;
    context.canGoNext = this.normalizeIndex(runtime, runtime.activeIndex + 1) !== null;
    context.isLoading = Boolean(activeSlide?.fullLoading);
    context.hasError = Boolean(activeSlide?.fullError);
  }

  private bindOverlayEvents(runtime: GalleryRuntime): void {
    this.listen(runtime, runtime.elements.closeButton, 'click', () => this.close());
    this.listen(runtime, runtime.elements.prevButton, 'click', () => this.navigateBy(-1));
    this.listen(runtime, runtime.elements.nextButton, 'click', () => this.navigateBy(1));
    this.listen(runtime, runtime.elements.backdrop, 'click', () => {
      if (runtime.options.closeOnBackdrop) {
        this.close();
      }
    });
    this.listen(runtime, runtime.elements.stage, 'dblclick', (event) => {
      event.preventDefault();
      this.toggleZoom(event.clientX, event.clientY);
    });
    this.listen(runtime, runtime.elements.stage, 'wheel', (event) => this.onWheel(event), {
      passive: false,
    });
    this.listen(
      runtime,
      runtime.elements.stage,
      'touchmove',
      (event) => this.preventNativePinch(event),
      { passive: false },
    );
    this.listen(runtime, runtime.elements.stage, 'gesturestart', preventDefault);
    this.listen(runtime, runtime.elements.stage, 'gesturechange', preventDefault);
    this.listen(runtime, runtime.elements.stage, 'pointerdown', (event) =>
      this.onPointerDown(event),
    );
    this.listen(runtime, runtime.elements.stage, 'pointermove', (event) =>
      this.onPointerMove(event),
    );
    this.listen(runtime, runtime.elements.stage, 'pointerup', (event) => this.onPointerUp(event));
    this.listen(runtime, runtime.elements.stage, 'pointercancel', (event) =>
      this.onPointerUp(event),
    );
    this.listen(runtime, this.document, 'keydown', (event) => this.onKeyDown(event));
    this.listen(runtime, window, 'resize', () => this.onResize());
  }

  private listen<K extends keyof WindowEventMap>(
    runtime: GalleryRuntime,
    target: Window,
    eventName: K,
    listener: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
  private listen<K extends keyof DocumentEventMap>(
    runtime: GalleryRuntime,
    target: Document,
    eventName: K,
    listener: (event: DocumentEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
  private listen<K extends keyof HTMLElementEventMap>(
    runtime: GalleryRuntime,
    target: HTMLElement,
    eventName: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
  private listen(
    runtime: GalleryRuntime,
    target: Window | Document | HTMLElement,
    eventName: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void;
  private listen(
    runtime: GalleryRuntime,
    target: Window | Document | HTMLElement,
    eventName: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    target.addEventListener(eventName, listener, options);
    runtime.cleanup.push(() => target.removeEventListener(eventName, listener, options));
  }

  private renderVisibleSlides(runtime: GalleryRuntime): void {
    runtime.elements.track.textContent = '';
    runtime.elements.track.style.transition = '';
    runtime.elements.track.style.transform = 'translate3d(0, 0, 0)';

    this.createVisibleSlide(runtime, -1);
    this.createVisibleSlide(runtime, 0);
    this.createVisibleSlide(runtime, 1);
    this.updateUi(runtime);
  }

  private createVisibleSlide(runtime: GalleryRuntime, position: -1 | 0 | 1): void {
    const index = this.normalizeIndex(runtime, runtime.activeIndex + position);
    const slideElement = this.document.createElement('div');
    slideElement.className = this.getSlideClassName(position);

    if (index === null) {
      runtime.elements.track.appendChild(slideElement);
      return;
    }

    const slide = runtime.slides[index];
    const media = this.document.createElement('div');
    media.className = 'ngx-image-gallery-media';

    const thumbImage = this.document.createElement('img');
    thumbImage.className = 'ngx-image-gallery-image ngx-image-gallery-thumb';
    thumbImage.alt = slide.item.alt ?? '';
    thumbImage.draggable = false;
    thumbImage.src = slide.thumbSrc;

    media.appendChild(thumbImage);

    let fullImage: HTMLImageElement | null = null;
    if (slide.fullLoaded && slide.fullSrc) {
      fullImage = this.createFullImage(slide, true);
      media.appendChild(fullImage);
    }

    slide.elements = {
      slide: slideElement,
      media,
      thumbImage,
      fullImage,
    };

    slideElement.appendChild(media);
    runtime.elements.track.appendChild(slideElement);
    this.applyMediaLayout(slide, runtime, 'instant');
  }

  private getSlideClassName(position: -1 | 0 | 1): string {
    if (position < 0) {
      return 'ngx-image-gallery-slide ngx-image-gallery-slide-prev';
    }
    if (position > 0) {
      return 'ngx-image-gallery-slide ngx-image-gallery-slide-next';
    }
    return 'ngx-image-gallery-slide ngx-image-gallery-slide-current';
  }

  private createFullImage(slide: SlideRuntime, loaded: boolean): HTMLImageElement {
    const image = this.document.createElement('img');
    image.className = loaded
      ? 'ngx-image-gallery-image ngx-image-gallery-full ngx-image-gallery-loaded'
      : 'ngx-image-gallery-image ngx-image-gallery-full';
    image.alt = slide.item.alt ?? '';
    image.draggable = false;
    if (slide.item.sizes) {
      image.sizes = slide.item.sizes;
    }
    if (slide.item.srcset) {
      image.srcset = slide.item.srcset;
    }
    image.src = slide.fullSrc ?? slide.item.fullSrc;
    return image;
  }

  private startOpeningAnimation(runtime: GalleryRuntime): void {
    const activeSlide = this.getActiveSlide(runtime);
    if (activeSlide?.elements && activeSlide.originElement) {
      this.applyOriginTransform(activeSlide, true);
    }

    runtime.elements.overlay.getBoundingClientRect();
    window.requestAnimationFrame(() => {
      if (this.runtime !== runtime || runtime.isClosing) {
        return;
      }

      runtime.elements.overlay.classList.add('ngx-image-gallery-open');
      if (activeSlide) {
        this.applyMediaLayout(activeSlide, runtime);
      }
      runtime.openTimer = window.setTimeout(
        () => this.finishOpening(runtime),
        ANIMATION_DURATION_MS,
      );
    });
  }

  private finishOpening(runtime: GalleryRuntime): void {
    if (this.runtime !== runtime || runtime.isClosing) {
      return;
    }

    const activeSlide = this.getActiveSlide(runtime);
    if (activeSlide) {
      this.clearOriginCrop(activeSlide);
    }

    runtime.isOpening = false;
    runtime.openTimer = null;
    runtime.elements.stage.focus({ preventScroll: true });
    this.loadActiveFullImage(runtime);
  }

  private applyOriginTransform(slide: SlideRuntime, immediate = false): void {
    if (!slide.elements || !slide.originElement) {
      return;
    }

    const origin = slide.originElement.getBoundingClientRect();
    if (origin.width <= 0 || origin.height <= 0) {
      return;
    }

    const originCrop = this.getOriginCrop(slide, origin);
    slide.elements.media.style.transition = immediate ? 'none' : '';
    if (originCrop) {
      this.applyOriginCrop(slide, originCrop);
      slide.elements.media.style.width = `${origin.width}px`;
      slide.elements.media.style.height = `${origin.height}px`;
      slide.elements.media.style.transform = `translate3d(${origin.left}px, ${origin.top}px, 0) scale(1)`;
    } else {
      this.clearOriginCrop(slide);
      slide.elements.media.style.width = `${slide.fitted.width}px`;
      slide.elements.media.style.height = `${slide.fitted.height}px`;
      slide.elements.media.style.transform = `translate3d(${origin.left}px, ${origin.top}px, 0) scale(${origin.width / slide.fitted.width})`;
    }

    if (immediate) {
      slide.elements.media.getBoundingClientRect();
    }
  }

  private getOriginCrop(slide: SlideRuntime, origin: DOMRect): OriginCrop | null {
    if (!slide.originElement || slide.item.thumbCropped === false) {
      return null;
    }

    const originImage = findImageElement(slide.originElement);
    const shouldCrop =
      slide.item.thumbCropped === true ||
      (slide.item.thumbCropped === undefined &&
        originImage !== null &&
        this.isCroppedOrigin(originImage, origin, slide));

    if (!shouldCrop) {
      return null;
    }

    return {
      objectPosition: originImage ? this.getOriginObjectPosition(originImage) : '50% 50%',
    };
  }

  private isCroppedOrigin(
    originImage: HTMLImageElement,
    origin: DOMRect,
    slide: SlideRuntime,
  ): boolean {
    if (getComputedStyle(originImage).objectFit !== 'cover') {
      return false;
    }

    const originRatio = origin.width / origin.height;
    const mediaRatio = slide.fitted.width / slide.fitted.height;
    return Math.abs(originRatio / mediaRatio - 1) > ORIGIN_RATIO_TOLERANCE;
  }

  private getOriginObjectPosition(originImage: HTMLImageElement): string {
    return getComputedStyle(originImage).objectPosition || '50% 50%';
  }

  private applyOriginCrop(slide: SlideRuntime, originCrop: OriginCrop): void {
    if (!slide.elements) {
      return;
    }

    slide.elements.media.classList.add('ngx-image-gallery-origin-crop');
    slide.elements.thumbImage.style.objectPosition = originCrop.objectPosition;
    if (slide.elements.fullImage) {
      slide.elements.fullImage.style.objectPosition = originCrop.objectPosition;
    }
  }

  private clearOriginCrop(slide: SlideRuntime): void {
    if (!slide.elements) {
      return;
    }

    slide.elements.media.classList.remove('ngx-image-gallery-origin-crop');
    slide.elements.thumbImage.style.objectPosition = '';
    if (slide.elements.fullImage) {
      slide.elements.fullImage.style.objectPosition = '';
    }
  }

  private applyMediaLayout(
    slide: SlideRuntime,
    runtime: GalleryRuntime,
    mode: 'animate' | 'instant' | 'interactive' = 'animate',
  ): void {
    if (!slide.elements) {
      return;
    }

    slide.fitted = fitIntoViewport(slide.dimensions, runtime.viewport, VIEWPORT_PADDING_PX);
    slide.zoomBounds = calculateZoomBounds(slide.dimensions, slide.fitted);
    slide.zoomScale = clamp(slide.zoomScale, slide.zoomBounds.minScale, slide.zoomBounds.maxScale);
    slide.pan = clampPan(slide.pan, runtime.viewport, slide.fitted, slide.zoomScale);

    slide.elements.media.style.transition = mode === 'animate' ? '' : 'none';
    slide.elements.media.style.width = `${slide.fitted.width}px`;
    slide.elements.media.style.height = `${slide.fitted.height}px`;
    slide.elements.media.style.transform = this.getMediaTransform(slide);

    if (mode === 'instant') {
      slide.elements.media.getBoundingClientRect();
      slide.elements.media.style.transition = '';
    }
  }

  private scheduleInteractiveMediaLayout(slide: SlideRuntime, runtime: GalleryRuntime): void {
    if (runtime.mediaFrame !== null) {
      return;
    }

    runtime.mediaFrame = window.requestAnimationFrame(() => {
      runtime.mediaFrame = null;
      if (this.runtime !== runtime) {
        return;
      }

      this.applyMediaLayout(slide, runtime, 'interactive');
    });
  }

  private restoreInteractiveMediaTransition(runtime: GalleryRuntime): void {
    const activeSlide = this.getActiveSlide(runtime);
    if (activeSlide?.elements) {
      activeSlide.elements.media.style.transition = '';
    }
  }

  private getMediaTransform(slide: SlideRuntime): string {
    const origin = getScaledOrigin(slide.fitted, slide.zoomScale);
    const x = origin.x + slide.pan.x;
    const y = origin.y + slide.pan.y;
    return `translate3d(${x}px, ${y}px, 0) scale(${slide.zoomScale})`;
  }

  private loadActiveFullImage(runtime: GalleryRuntime): void {
    const slide = this.getActiveSlide(runtime);
    if (!slide || slide.fullLoaded || slide.fullLoading || slide.fullError) {
      this.updateUi(runtime);
      return;
    }

    slide.fullLoading = true;
    this.updateUi(runtime);

    this.imageLoader
      .load(slide.item)
      .then((loaded) => {
        if (this.runtime !== runtime) {
          return;
        }

        this.onFullImageLoaded(runtime, slide, loaded);
      })
      .catch(() => {
        if (this.runtime !== runtime) {
          return;
        }

        slide.fullLoading = false;
        slide.fullError = true;
        this.updateUi(runtime);
      });
  }

  private onFullImageLoaded(
    runtime: GalleryRuntime,
    slide: SlideRuntime,
    loaded: LoadedImage,
  ): void {
    slide.fullLoading = false;
    slide.fullLoaded = true;
    slide.fullError = false;
    slide.fullSrc = loaded.src;
    slide.dimensions = {
      width: loaded.width,
      height: loaded.height,
      provisional: false,
    };

    if (!slide.userZoomed) {
      slide.zoomScale = 1;
      slide.pan = { x: 0, y: 0 };
    }

    if (slide.elements) {
      if (!slide.elements.fullImage) {
        slide.elements.fullImage = this.createFullImage(slide, false);
        slide.elements.media.appendChild(slide.elements.fullImage);
      }
      window.requestAnimationFrame(() => {
        slide.elements?.fullImage?.classList.add('ngx-image-gallery-loaded');
      });
    }

    this.applyMediaLayout(slide, runtime);
    this.updateUi(runtime);
  }

  private onResize(): void {
    const runtime = this.runtime;
    if (!runtime) {
      return;
    }

    runtime.viewport = this.getViewportSize();
    runtime.slides.forEach((slide) => this.applyMediaLayout(slide, runtime, 'instant'));
  }

  private onKeyDown(event: KeyboardEvent): void {
    const runtime = this.runtime;
    if (!runtime) {
      return;
    }

    if (event.key === 'Escape' && runtime.options.closeOnEsc) {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.navigateBy(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.navigateBy(1);
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event, runtime);
    }
  }

  private trapFocus(event: KeyboardEvent, runtime: GalleryRuntime): void {
    const focusable = this.getFocusableElements(runtime);

    if (focusable.length === 0) {
      event.preventDefault();
      runtime.elements.stage.focus({ preventScroll: true });
      return;
    }

    const currentIndex = focusable.indexOf(this.document.activeElement as HTMLButtonElement);
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? focusable.length - 1
        : currentIndex - 1
      : currentIndex === focusable.length - 1
        ? 0
        : currentIndex + 1;

    event.preventDefault();
    focusable[nextIndex].focus({ preventScroll: true });
  }

  private getFocusableElements(runtime: GalleryRuntime): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(runtime.elements.ui.querySelectorAll<HTMLElement>(selectors)).filter(
      (element) => element.closest('[hidden], [aria-hidden="true"]') === null,
    );
  }

  private onPointerDown(event: PointerEvent): void {
    const runtime = this.runtime;
    if (!runtime || runtime.isOpening || runtime.isClosing) {
      return;
    }

    runtime.elements.stage.setPointerCapture?.(event.pointerId);
    runtime.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const activeSlide = this.getActiveSlide(runtime);
    if (!activeSlide) {
      return;
    }

    if (runtime.pointers.size === 2) {
      const [first, second] = Array.from(runtime.pointers.values());
      runtime.gesture = {
        mode: 'pinch',
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        startPan: { ...activeSlide.pan },
        startZoomScale: activeSlide.zoomScale,
        startDistance: distance(first, second),
        startCenter: midpoint(first, second),
      };
      return;
    }

    runtime.gesture = {
      mode: activeSlide.zoomScale > 1 ? 'pan' : 'swipe',
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      startPan: { ...activeSlide.pan },
      startZoomScale: activeSlide.zoomScale,
      startDistance: 0,
      startCenter: { x: event.clientX, y: event.clientY },
    };
  }

  private onPointerMove(event: PointerEvent): void {
    const runtime = this.runtime;
    if (!runtime) {
      return;
    }

    if (!runtime.gesture) {
      this.panZoomedSlideToCursor(runtime, event);
      return;
    }

    if (!runtime.pointers.has(event.pointerId)) {
      return;
    }

    event.preventDefault();
    runtime.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const activeSlide = this.getActiveSlide(runtime);
    if (!activeSlide) {
      return;
    }

    if (runtime.pointers.size === 2 && runtime.gesture.mode === 'pinch') {
      this.applyPinch(runtime, activeSlide);
      return;
    }

    const deltaX = event.clientX - runtime.gesture.startX;
    const deltaY = event.clientY - runtime.gesture.startY;
    runtime.gesture.lastX = event.clientX;

    if (runtime.gesture.mode === 'pan') {
      activeSlide.pan = clampPan(
        {
          x: runtime.gesture.startPan.x + deltaX,
          y: runtime.gesture.startPan.y + deltaY,
        },
        runtime.viewport,
        activeSlide.fitted,
        activeSlide.zoomScale,
      );
      activeSlide.userZoomed = true;
      this.scheduleInteractiveMediaLayout(activeSlide, runtime);
      return;
    }

    runtime.elements.track.style.transition = 'none';
    runtime.elements.track.style.transform = `translate3d(${deltaX}px, 0, 0)`;
  }

  private panZoomedSlideToCursor(runtime: GalleryRuntime, event: PointerEvent): void {
    if (
      runtime.isOpening ||
      runtime.isClosing ||
      event.pointerType === 'touch' ||
      event.buttons > 0
    ) {
      return;
    }

    const activeSlide = this.getActiveSlide(runtime);
    if (!activeSlide || activeSlide.zoomScale <= activeSlide.zoomBounds.minScale) {
      return;
    }

    const halfViewportWidth = runtime.viewport.width / 2;
    const halfViewportHeight = runtime.viewport.height / 2;
    const overflowX = Math.max(
      0,
      (activeSlide.fitted.width * activeSlide.zoomScale - runtime.viewport.width) / 2,
    );
    const overflowY = Math.max(
      0,
      (activeSlide.fitted.height * activeSlide.zoomScale - runtime.viewport.height) / 2,
    );

    activeSlide.pan = clampPan(
      {
        x:
          halfViewportWidth > 0
            ? -((event.clientX - halfViewportWidth) / halfViewportWidth) * overflowX
            : 0,
        y:
          halfViewportHeight > 0
            ? -((event.clientY - halfViewportHeight) / halfViewportHeight) * overflowY
            : 0,
      },
      runtime.viewport,
      activeSlide.fitted,
      activeSlide.zoomScale,
    );
    activeSlide.userZoomed = true;
    this.scheduleInteractiveMediaLayout(activeSlide, runtime);
  }

  private applyPinch(runtime: GalleryRuntime, activeSlide: SlideRuntime): void {
    if (!runtime.gesture) {
      return;
    }

    const [first, second] = Array.from(runtime.pointers.values());
    const nextDistance = distance(first, second);
    const ratio =
      runtime.gesture.startDistance > 0 ? nextDistance / runtime.gesture.startDistance : 1;
    const targetScale = clamp(
      runtime.gesture.startZoomScale * ratio,
      activeSlide.zoomBounds.minScale,
      activeSlide.zoomBounds.maxScale,
    );
    this.applyZoomAtPoint(
      runtime,
      activeSlide,
      runtime.gesture.startCenter,
      midpoint(first, second),
      targetScale,
      runtime.gesture.startPan,
      runtime.gesture.startZoomScale,
      'interactive',
    );
  }

  private onPointerUp(event: PointerEvent): void {
    const runtime = this.runtime;
    if (!runtime) {
      return;
    }

    runtime.elements.stage.releasePointerCapture?.(event.pointerId);
    const gesture = runtime.gesture;
    runtime.pointers.delete(event.pointerId);

    if (!gesture || runtime.pointers.size > 0) {
      return;
    }

    runtime.gesture = null;
    this.restoreInteractiveMediaTransition(runtime);
    if (gesture.mode !== 'swipe') {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      this.navigateBy(deltaX < 0 ? 1 : -1);
      return;
    }

    this.resetTrack(runtime);
  }

  private toggleZoom(clientX: number, clientY: number): void {
    const runtime = this.runtime;
    const activeSlide = runtime ? this.getActiveSlide(runtime) : null;
    if (!runtime || !activeSlide) {
      return;
    }

    const targetScale = getNextZoomScale(activeSlide.zoomScale, activeSlide.zoomBounds);
    this.applyZoomAtPoint(
      runtime,
      activeSlide,
      { x: clientX, y: clientY },
      { x: clientX, y: clientY },
      targetScale,
      activeSlide.pan,
      activeSlide.zoomScale,
    );
  }

  private onWheel(event: WheelEvent): void {
    const runtime = this.runtime;
    const activeSlide = runtime ? this.getActiveSlide(runtime) : null;
    if (!runtime || !activeSlide || runtime.isOpening || runtime.isClosing || event.deltaY === 0) {
      return;
    }

    event.preventDefault();
    const factor = event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
    const targetScale = clamp(
      activeSlide.zoomScale * factor,
      activeSlide.zoomBounds.minScale,
      activeSlide.zoomBounds.maxScale,
    );
    this.applyZoomAtPoint(
      runtime,
      activeSlide,
      { x: event.clientX, y: event.clientY },
      { x: event.clientX, y: event.clientY },
      targetScale,
      activeSlide.pan,
      activeSlide.zoomScale,
      'interactive',
    );
  }

  private applyZoomAtPoint(
    runtime: GalleryRuntime,
    activeSlide: SlideRuntime,
    anchorPoint: GalleryPoint,
    targetPoint: GalleryPoint,
    targetScale: number,
    pan: GalleryPoint,
    currentScale: number,
    mode: 'animate' | 'instant' | 'interactive' = 'animate',
  ): void {
    activeSlide.pan = calculateZoomPanForPoint({
      viewport: runtime.viewport,
      fitted: activeSlide.fitted,
      anchorPoint,
      targetPoint,
      pan,
      currentScale,
      targetScale,
    });
    activeSlide.zoomScale = targetScale;
    activeSlide.userZoomed = targetScale !== activeSlide.zoomBounds.minScale;
    if (mode === 'interactive') {
      this.scheduleInteractiveMediaLayout(activeSlide, runtime);
      return;
    }

    this.applyMediaLayout(activeSlide, runtime, mode);
  }

  private preventNativePinch(event: TouchEvent): void {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }

  private navigateBy(delta: number): void {
    const runtime = this.runtime;
    if (!runtime || runtime.isOpening || runtime.isClosing || runtime.isNavigating) {
      return;
    }

    const nextIndex = this.normalizeIndex(runtime, runtime.activeIndex + delta);
    if (nextIndex === null || nextIndex === runtime.activeIndex) {
      this.resetTrack(runtime);
      return;
    }

    runtime.isNavigating = true;
    runtime.elements.track.style.transition = `transform ${NAVIGATION_DURATION_MS}ms ease`;
    runtime.elements.track.style.transform = `translate3d(${delta > 0 ? '-100%' : '100%'}, 0, 0)`;

    window.setTimeout(() => {
      if (this.runtime !== runtime) {
        return;
      }

      runtime.activeIndex = nextIndex;
      runtime.isNavigating = false;
      runtime.pointers.clear();
      runtime.gesture = null;
      this.renderVisibleSlides(runtime);
      this.updateState(runtime);
      this.loadActiveFullImage(runtime);
    }, NAVIGATION_DURATION_MS);
  }

  private resetTrack(runtime: GalleryRuntime): void {
    runtime.elements.track.style.transition = `transform ${NAVIGATION_DURATION_MS}ms ease`;
    runtime.elements.track.style.transform = 'translate3d(0, 0, 0)';
  }

  private updateUi(runtime: GalleryRuntime): void {
    const activeSlide = this.getActiveSlide(runtime);
    runtime.elements.counter.hidden = !runtime.options.showCounter;
    runtime.elements.counter.textContent = `${runtime.activeIndex + 1} / ${runtime.items.length}`;

    const canGoPrevious = this.normalizeIndex(runtime, runtime.activeIndex - 1) !== null;
    const canGoNext = this.normalizeIndex(runtime, runtime.activeIndex + 1) !== null;
    runtime.elements.prevButton.disabled = !canGoPrevious;
    runtime.elements.nextButton.disabled = !canGoNext;

    runtime.elements.loading.classList.toggle(
      'ngx-image-gallery-visible',
      Boolean(activeSlide?.fullLoading),
    );
    runtime.elements.error.classList.toggle(
      'ngx-image-gallery-visible',
      Boolean(activeSlide?.fullError),
    );
    this.updateCustomLightbox(runtime);
  }

  private updateState(runtime: GalleryRuntime): void {
    const activeItem = runtime.items[runtime.activeIndex] ?? null;
    this.zone.run(() => {
      this.stateSignal.set({
        isOpen: true,
        activeIndex: runtime.activeIndex,
        activeItem,
      });
    });
  }

  private destroyRuntime(runtime: GalleryRuntime): void {
    if (this.runtime !== runtime) {
      return;
    }

    if (runtime.mediaFrame !== null) {
      window.cancelAnimationFrame(runtime.mediaFrame);
      runtime.mediaFrame = null;
    }
    runtime.cleanup.forEach((cleanup) => cleanup());
    runtime.cleanup = [];
    runtime.customLightbox?.viewRef.destroy();
    runtime.customLightbox = null;
    runtime.elements.overlay.remove();
    runtime.previousFocus?.focus({ preventScroll: true });
    this.runtime = null;
    this.zone.run(() => {
      this.stateSignal.set({
        isOpen: false,
        activeIndex: -1,
        activeItem: null,
      });
    });
  }

  private getActiveSlide(runtime: GalleryRuntime): SlideRuntime | null {
    return runtime.slides[runtime.activeIndex] ?? null;
  }

  private normalizeIndex(runtime: GalleryRuntime, index: number): number | null {
    if (runtime.items.length === 0) {
      return null;
    }

    if (runtime.options.loop && runtime.items.length > 1) {
      if (index < 0) {
        return runtime.items.length - 1;
      }
      if (index >= runtime.items.length) {
        return 0;
      }
      return index;
    }

    if (index < 0 || index >= runtime.items.length) {
      return null;
    }

    return index;
  }

  private getViewportSize(): GallerySize {
    return {
      width: window.innerWidth || this.document.documentElement.clientWidth || 1,
      height: window.innerHeight || this.document.documentElement.clientHeight || 1,
    };
  }
}

function distance(first: GalleryPoint, second: GalleryPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function midpoint(first: GalleryPoint, second: GalleryPoint): GalleryPoint {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function preventDefault(event: Event): void {
  event.preventDefault();
}
