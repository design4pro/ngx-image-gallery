import type { NgxImageGalleryItem } from './gallery-types';

export interface GallerySize {
  width: number;
  height: number;
}

export interface GalleryPoint {
  x: number;
  y: number;
}

export interface GalleryRect extends GallerySize {
  x: number;
  y: number;
}

export interface ResolvedDimensions extends GallerySize {
  provisional: boolean;
}

export interface ZoomBounds {
  minScale: number;
  maxScale: number;
  initialScale: number;
}

const DEFAULT_ASPECT_RATIO = 1;

export function getImageSource(item: NgxImageGalleryItem, originElement?: HTMLElement): string {
  if (item.thumbSrc) {
    return item.thumbSrc;
  }

  const image = findImageElement(originElement);
  return image?.currentSrc || image?.src || item.fullSrc;
}

export function findImageElement(originElement?: HTMLElement): HTMLImageElement | null {
  if (!originElement) {
    return null;
  }

  if (originElement instanceof HTMLImageElement) {
    return originElement;
  }

  return originElement.querySelector('img');
}

export function resolveImageDimensions(
  item: NgxImageGalleryItem,
  originElement: HTMLElement | undefined,
  provisionalLongEdge: number,
): ResolvedDimensions {
  if (isPositiveNumber(item.width) && isPositiveNumber(item.height)) {
    return {
      width: item.width,
      height: item.height,
      provisional: false,
    };
  }

  const ratio = getThumbnailAspectRatio(originElement) || DEFAULT_ASPECT_RATIO;

  if (ratio >= 1) {
    return {
      width: provisionalLongEdge,
      height: Math.max(1, Math.round(provisionalLongEdge / ratio)),
      provisional: true,
    };
  }

  return {
    width: Math.max(1, Math.round(provisionalLongEdge * ratio)),
    height: provisionalLongEdge,
    provisional: true,
  };
}

export function getThumbnailAspectRatio(originElement?: HTMLElement): number | null {
  const image = findImageElement(originElement);

  if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return image.naturalWidth / image.naturalHeight;
  }

  if (!originElement) {
    return null;
  }

  const rect = originElement.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return rect.width / rect.height;
  }

  return null;
}

export function fitIntoViewport(
  size: GallerySize,
  viewport: GallerySize,
  padding = 32,
): GalleryRect {
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const scale = Math.min(availableWidth / size.width, availableHeight / size.height, 1);
  const width = Math.max(1, Math.round(size.width * scale));
  const height = Math.max(1, Math.round(size.height * scale));

  return {
    x: Math.round((viewport.width - width) / 2),
    y: Math.round((viewport.height - height) / 2),
    width,
    height,
  };
}

export function calculateZoomBounds(source: GallerySize, fitted: GallerySize): ZoomBounds {
  const originalScale = Math.max(source.width / fitted.width, source.height / fitted.height);

  return {
    minScale: 1,
    initialScale: 1,
    maxScale: Math.max(2.5, originalScale, 1),
  };
}

export function clampPan(
  pan: GalleryPoint,
  viewport: GallerySize,
  fitted: GallerySize,
  scale: number,
): GalleryPoint {
  const overflowX = Math.max(0, (fitted.width * scale - viewport.width) / 2);
  const overflowY = Math.max(0, (fitted.height * scale - viewport.height) / 2);

  return {
    x: clamp(pan.x, -overflowX, overflowX),
    y: clamp(pan.y, -overflowY, overflowY),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isPositiveNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
