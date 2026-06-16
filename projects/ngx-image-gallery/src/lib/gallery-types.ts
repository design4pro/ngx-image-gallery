import { InjectionToken, type Provider } from '@angular/core';

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

export interface NgxImageGalleryOptions {
  loadOriginal: 'after-open';
  provisionalLongEdge: number;
  loop: boolean;
  closeOnEsc: boolean;
  closeOnBackdrop: boolean;
  showCounter: boolean;
}

export interface NgxImageGalleryOpenOptions extends Partial<NgxImageGalleryOptions> {
  originElement?: HTMLElement;
  originElements?: readonly (HTMLElement | undefined)[];
}

export interface NgxImageGalleryState {
  isOpen: boolean;
  activeIndex: number;
  activeItem: NgxImageGalleryItem | null;
}

export const DEFAULT_NGX_IMAGE_GALLERY_OPTIONS: NgxImageGalleryOptions = {
  loadOriginal: 'after-open',
  provisionalLongEdge: 1600,
  loop: true,
  closeOnEsc: true,
  closeOnBackdrop: true,
  showCounter: true,
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
