import type { NgxImageGalleryItem } from './gallery-types';

export interface LoadedImage {
  width: number;
  height: number;
  src: string;
}

export interface ImageLoader {
  load(
    item: NgxImageGalleryItem & { fullSrc: string },
    image?: HTMLImageElement,
  ): Promise<LoadedImage>;
}

export class BrowserImageLoader implements ImageLoader {
  load(
    item: NgxImageGalleryItem & { fullSrc: string },
    image?: HTMLImageElement,
  ): Promise<LoadedImage> {
    const target = image ?? new Image();

    return new Promise<LoadedImage>((resolve, reject) => {
      target.onload = () => {
        resolve({
          width: target.naturalWidth || target.width,
          height: target.naturalHeight || target.height,
          src: target.currentSrc || target.src,
        });
      };
      target.onerror = () => {
        reject(new Error(`Failed to load image: ${item.fullSrc}`));
      };

      if (item.sizes) {
        target.sizes = item.sizes;
      }
      if (item.srcset) {
        target.srcset = item.srcset;
      }

      target.src = item.fullSrc;
    });
  }
}
