import {
  InjectionToken,
  type Provider,
  type TemplateRef,
  type ViewContainerRef,
} from '@angular/core';

export interface NgxImageGalleryItem {
  fullSrc: string;
  thumbSrc?: string;
  alt?: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
  thumbCropped?: boolean;
  id?: string;
  data?: unknown;
}

export type NgxImageGalleryClassValue = string | readonly string[] | null | undefined;

export interface NgxImageGalleryClasses {
  overlay?: NgxImageGalleryClassValue;
  backdrop?: NgxImageGalleryClassValue;
  stage?: NgxImageGalleryClassValue;
  track?: NgxImageGalleryClassValue;
  ui?: NgxImageGalleryClassValue;
  defaultUi?: NgxImageGalleryClassValue;
  customUi?: NgxImageGalleryClassValue;
  button?: NgxImageGalleryClassValue;
  closeButton?: NgxImageGalleryClassValue;
  previousButton?: NgxImageGalleryClassValue;
  nextButton?: NgxImageGalleryClassValue;
  counter?: NgxImageGalleryClassValue;
  thumbnails?: NgxImageGalleryClassValue;
  thumbnailButton?: NgxImageGalleryClassValue;
  thumbnailImage?: NgxImageGalleryClassValue;
  loading?: NgxImageGalleryClassValue;
  error?: NgxImageGalleryClassValue;
}

export interface NgxImageGalleryOptions {
  loadOriginal: 'after-open';
  provisionalLongEdge: number;
  loop: boolean;
  closeOnEsc: boolean;
  closeOnBackdrop: boolean;
  showCounter: boolean;
  showThumbnails: boolean;
  classes: NgxImageGalleryClasses;
}

export interface NgxImageGalleryOpenOptions extends Partial<NgxImageGalleryOptions> {
  originElement?: HTMLElement;
  originElements?: readonly (HTMLElement | undefined)[];
  lightboxTemplate?: TemplateRef<NgxImageGalleryLightboxContext>;
  lightboxViewContainer?: ViewContainerRef;
}

export interface NgxImageGalleryState {
  isOpen: boolean;
  activeIndex: number;
  activeItem: NgxImageGalleryItem | null;
}

export interface NgxImageGalleryLightboxContext {
  $implicit: NgxImageGalleryLightboxContext;
  state: NgxImageGalleryState;
  items: readonly NgxImageGalleryItem[];
  activeItem: NgxImageGalleryItem | null;
  activeIndex: number;
  count: number;
  isOpen: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLoading: boolean;
  hasError: boolean;
  close: () => void;
  previous: () => void;
  next: () => void;
  goTo: (index: number) => void;
}

export const DEFAULT_NGX_IMAGE_GALLERY_OPTIONS: NgxImageGalleryOptions = {
  loadOriginal: 'after-open',
  provisionalLongEdge: 1600,
  loop: true,
  closeOnEsc: true,
  closeOnBackdrop: true,
  showCounter: true,
  showThumbnails: false,
  classes: {},
};

export const NGX_IMAGE_GALLERY_OPTIONS = new InjectionToken<NgxImageGalleryOptions>(
  'NGX_IMAGE_GALLERY_OPTIONS',
  {
    factory: () => DEFAULT_NGX_IMAGE_GALLERY_OPTIONS,
  },
);

export function provideNgxImageGallery(options: Partial<NgxImageGalleryOptions> = {}): Provider {
  return {
    provide: NGX_IMAGE_GALLERY_OPTIONS,
    useValue: {
      ...DEFAULT_NGX_IMAGE_GALLERY_OPTIONS,
      ...options,
      loadOriginal: 'after-open',
    } satisfies NgxImageGalleryOptions,
  };
}
