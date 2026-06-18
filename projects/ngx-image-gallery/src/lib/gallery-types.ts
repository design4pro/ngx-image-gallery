import {
  InjectionToken,
  type Provider,
  type TemplateRef,
  type ViewContainerRef,
} from '@angular/core';

export interface NgxImageGalleryItem {
  fullSrc?: string;
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

export interface NgxImageGalleryLabels {
  dialog: string;
  closeButton: string;
  previousButton: string;
  nextButton: string;
  counter: (current: number, total: number) => string;
  thumbnails: string;
  thumbnailButton: (item: NgxImageGalleryItem, index: number, total: number) => string;
  loading: string;
  error: string;
}

export type NgxImageGalleryLabelsInput = Partial<NgxImageGalleryLabels>;

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
  provisionalLongEdge: number;
  loop: boolean;
  closeOnEsc: boolean;
  closeOnBackdrop: boolean;
  showCounter: boolean;
  showThumbnails: boolean;
  classes: NgxImageGalleryClasses;
  labels: NgxImageGalleryLabels;
}

export type NgxImageGalleryOptionsInput = Omit<
  Partial<NgxImageGalleryOptions>,
  'classes' | 'labels'
> & {
  classes?: NgxImageGalleryClasses;
  labels?: NgxImageGalleryLabelsInput;
};

export interface NgxImageGalleryOpenOptions extends NgxImageGalleryOptionsInput {
  originElement?: HTMLElement;
  originElements?: readonly (HTMLElement | undefined)[];
  lightboxTemplate?: TemplateRef<NgxImageGalleryLightboxContext>;
  lightboxViewContainer?: ViewContainerRef;
  itemContentTemplates?: readonly (NgxImageGalleryItemContentTemplate | undefined)[];
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

export interface NgxImageGalleryItemContentTemplate {
  templateRef: TemplateRef<NgxImageGalleryItemContentContext>;
  viewContainerRef: ViewContainerRef;
}

export interface NgxImageGalleryItemContentContext {
  $implicit: NgxImageGalleryItem;
  item: NgxImageGalleryItem;
  index: number;
  count: number;
  active: boolean;
  gallery: NgxImageGalleryLightboxContext;
}

export const DEFAULT_NGX_IMAGE_GALLERY_LABELS: NgxImageGalleryLabels = {
  dialog: 'Image gallery',
  closeButton: 'Close gallery',
  previousButton: 'Previous image',
  nextButton: 'Next image',
  counter: (current, total) => `${current} / ${total}`,
  thumbnails: 'Gallery thumbnails',
  thumbnailButton: (item, index) =>
    item.alt ? `Show image ${index + 1}: ${item.alt}` : `Show image ${index + 1}`,
  loading: 'Loading image',
  error: 'Image could not be loaded',
};

export const DEFAULT_NGX_IMAGE_GALLERY_OPTIONS: NgxImageGalleryOptions = {
  provisionalLongEdge: 1600,
  loop: true,
  closeOnEsc: true,
  closeOnBackdrop: true,
  showCounter: true,
  showThumbnails: false,
  classes: {},
  labels: DEFAULT_NGX_IMAGE_GALLERY_LABELS,
};

export const NGX_IMAGE_GALLERY_OPTIONS = new InjectionToken<NgxImageGalleryOptions>(
  'NGX_IMAGE_GALLERY_OPTIONS',
  {
    factory: () => DEFAULT_NGX_IMAGE_GALLERY_OPTIONS,
  },
);

export function provideNgxImageGallery(options: NgxImageGalleryOptionsInput = {}): Provider {
  return {
    provide: NGX_IMAGE_GALLERY_OPTIONS,
    useValue: {
      ...DEFAULT_NGX_IMAGE_GALLERY_OPTIONS,
      ...options,
      classes: {
        ...DEFAULT_NGX_IMAGE_GALLERY_OPTIONS.classes,
        ...options.classes,
      },
      labels: {
        ...DEFAULT_NGX_IMAGE_GALLERY_LABELS,
        ...options.labels,
      },
    } satisfies NgxImageGalleryOptions,
  };
}
