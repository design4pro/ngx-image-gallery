import type { NgxImageGalleryItem } from './gallery-types';

export interface LoadedImage {
  width: number;
  height: number;
  src: string;
}

export interface ImageLoader {
  load(item: NgxImageGalleryItem & { fullSrc: string }): Promise<LoadedImage>;
}

export class BrowserImageLoader implements ImageLoader {
  load(item: NgxImageGalleryItem & { fullSrc: string }): Promise<LoadedImage> {
    return new Promise<LoadedImage>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
          src: image.currentSrc || image.src,
        });
      };
      image.onerror = () => {
        reject(new Error(`Failed to load image: ${item.fullSrc}`));
      };

      if (item.sizes) {
        image.sizes = item.sizes;
      }
      if (item.srcset) {
        image.srcset = item.srcset;
      }

      image.src = item.fullSrc;
    });
  }
}
