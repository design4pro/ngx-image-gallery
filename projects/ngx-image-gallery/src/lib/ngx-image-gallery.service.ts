import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import {
  calculateZoomBounds,
  clamp,
  clampPan,
  fitIntoViewport,
  getImageSource,
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
  type NgxImageGalleryItem,
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
  closeButton: HTMLButtonElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  counter: HTMLDivElement;
  loading: HTMLDivElement;
  error: HTMLDivElement;
}

interface PointerGesture {
  mode: 'swipe' | 'pan' | 'pinch';
  startX: number;
  startY: number;
  lastX: number;
  startPan: GalleryPoint;
  startZoomScale: number;
  startDistance: number;
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
}

const ANIMATION_DURATION_MS = 333;
const NAVIGATION_DURATION_MS = 220;
const SWIPE_THRESHOLD_PX = 60;
const VIEWPORT_PADDING_PX = 32;

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
      const elements = this.createOverlayElements();
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
      };

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

  private createOverlayElements(): OverlayElements {
    const overlay = this.document.createElement('div');
    overlay.className = 'ngx-image-gallery-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const backdrop = this.document.createElement('div');
    backdrop.className = 'ngx-image-gallery-backdrop';

    const stage = this.document.createElement('div');
    stage.className = 'ngx-image-gallery-stage';
    stage.tabIndex = -1;

    const track = this.document.createElement('div');
    track.className = 'ngx-image-gallery-track';

    const ui = this.document.createElement('div');
    ui.className = 'ngx-image-gallery-ui';

    const closeButton = this.createButton('ngx-image-gallery-close', 'Close gallery', '\u00d7');
    const prevButton = this.createButton('ngx-image-gallery-prev', 'Previous image', '\u2039');
    const nextButton = this.createButton('ngx-image-gallery-next', 'Next image', '\u203a');

    const counter = this.document.createElement('div');
    counter.className = 'ngx-image-gallery-counter';
    counter.setAttribute('aria-live', 'polite');

    const loading = this.document.createElement('div');
    loading.className = 'ngx-image-gallery-loading';
    loading.textContent = 'Loading image';

    const error = this.document.createElement('div');
    error.className = 'ngx-image-gallery-error';
    error.textContent = 'Image could not be loaded';

    ui.append(counter, closeButton, prevButton, nextButton, loading, error);
    stage.appendChild(track);
    overlay.append(backdrop, stage, ui);

    return {
      overlay,
      backdrop,
      stage,
      track,
      ui,
      closeButton,
      prevButton,
      nextButton,
      counter,
      loading,
      error,
    };
  }

  private createButton(className: string, label: string, text: string): HTMLButtonElement {
    const button = this.document.createElement('button');
    button.type = 'button';
    button.className = `ngx-image-gallery-button ${className}`;
    button.setAttribute('aria-label', label);
    button.textContent = text;
    return button;
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
  ): void;
  private listen<K extends keyof DocumentEventMap>(
    runtime: GalleryRuntime,
    target: Document,
    eventName: K,
    listener: (event: DocumentEventMap[K]) => void,
  ): void;
  private listen<K extends keyof HTMLElementEventMap>(
    runtime: GalleryRuntime,
    target: HTMLElement,
    eventName: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ): void;
  private listen(
    runtime: GalleryRuntime,
    target: Window | Document | HTMLElement,
    eventName: string,
    listener: EventListener,
  ): void {
    target.addEventListener(eventName, listener);
    runtime.cleanup.push(() => target.removeEventListener(eventName, listener));
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
    this.applyMediaLayout(slide, runtime, true);
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
      this.applyOriginTransform(activeSlide);
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

    runtime.isOpening = false;
    runtime.openTimer = null;
    runtime.elements.stage.focus({ preventScroll: true });
    this.loadActiveFullImage(runtime);
  }

  private applyOriginTransform(slide: SlideRuntime): void {
    if (!slide.elements || !slide.originElement) {
      return;
    }

    const origin = slide.originElement.getBoundingClientRect();
    if (origin.width <= 0 || origin.height <= 0) {
      return;
    }

    slide.elements.media.style.width = `${slide.fitted.width}px`;
    slide.elements.media.style.height = `${slide.fitted.height}px`;
    slide.elements.media.style.transform = `translate3d(${origin.left}px, ${origin.top}px, 0) scale(${origin.width / slide.fitted.width})`;
  }

  private applyMediaLayout(slide: SlideRuntime, runtime: GalleryRuntime, immediate = false): void {
    if (!slide.elements) {
      return;
    }

    slide.fitted = fitIntoViewport(slide.dimensions, runtime.viewport, VIEWPORT_PADDING_PX);
    slide.zoomBounds = calculateZoomBounds(slide.dimensions, slide.fitted);
    slide.zoomScale = clamp(slide.zoomScale, slide.zoomBounds.minScale, slide.zoomBounds.maxScale);
    slide.pan = clampPan(slide.pan, runtime.viewport, slide.fitted, slide.zoomScale);

    slide.elements.media.style.transition = immediate ? 'none' : '';
    slide.elements.media.style.width = `${slide.fitted.width}px`;
    slide.elements.media.style.height = `${slide.fitted.height}px`;
    slide.elements.media.style.transform = this.getMediaTransform(slide);

    if (immediate) {
      slide.elements.media.getBoundingClientRect();
      slide.elements.media.style.transition = '';
    }
  }

  private getMediaTransform(slide: SlideRuntime): string {
    const x = slide.fitted.x + slide.pan.x;
    const y = slide.fitted.y + slide.pan.y;
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
    runtime.slides.forEach((slide) => this.applyMediaLayout(slide, runtime, true));
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
    const focusable = [
      runtime.elements.closeButton,
      runtime.elements.prevButton,
      runtime.elements.nextButton,
    ].filter((element) => !element.disabled);

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
    };
  }

  private onPointerMove(event: PointerEvent): void {
    const runtime = this.runtime;
    if (!runtime || !runtime.gesture || !runtime.pointers.has(event.pointerId)) {
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
      this.applyMediaLayout(activeSlide, runtime, true);
      return;
    }

    runtime.elements.track.style.transition = 'none';
    runtime.elements.track.style.transform = `translate3d(${deltaX}px, 0, 0)`;
  }

  private applyPinch(runtime: GalleryRuntime, activeSlide: SlideRuntime): void {
    if (!runtime.gesture) {
      return;
    }

    const [first, second] = Array.from(runtime.pointers.values());
    const nextDistance = distance(first, second);
    const ratio =
      runtime.gesture.startDistance > 0 ? nextDistance / runtime.gesture.startDistance : 1;
    activeSlide.zoomScale = clamp(
      runtime.gesture.startZoomScale * ratio,
      activeSlide.zoomBounds.minScale,
      activeSlide.zoomBounds.maxScale,
    );
    activeSlide.pan = clampPan(
      activeSlide.pan,
      runtime.viewport,
      activeSlide.fitted,
      activeSlide.zoomScale,
    );
    activeSlide.userZoomed = true;
    this.applyMediaLayout(activeSlide, runtime, true);
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

    const targetScale =
      activeSlide.zoomScale === activeSlide.zoomBounds.minScale
        ? Math.min(activeSlide.zoomBounds.maxScale, 2.5)
        : activeSlide.zoomBounds.minScale;

    if (targetScale === activeSlide.zoomBounds.minScale) {
      activeSlide.pan = { x: 0, y: 0 };
    } else {
      const centerOffsetX = clientX - runtime.viewport.width / 2;
      const centerOffsetY = clientY - runtime.viewport.height / 2;
      activeSlide.pan = clampPan(
        {
          x: -centerOffsetX * (targetScale - 1) * 0.35,
          y: -centerOffsetY * (targetScale - 1) * 0.35,
        },
        runtime.viewport,
        activeSlide.fitted,
        targetScale,
      );
    }

    activeSlide.zoomScale = targetScale;
    activeSlide.userZoomed = targetScale !== activeSlide.zoomBounds.minScale;
    this.applyMediaLayout(activeSlide, runtime);
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

    runtime.cleanup.forEach((cleanup) => cleanup());
    runtime.cleanup = [];
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
