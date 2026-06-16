# ngx-image-gallery

Native Angular image gallery with a PhotoSwipe-like lightbox experience, progressive image loading, and no runtime dependency on PhotoSwipe.

## Features

- Standalone Angular directives and provider API.
- Smooth opening animation from the clicked thumbnail.
- No required original image dimensions.
- Provisional sizing from the thumbnail, followed by recalculation from `naturalWidth` and `naturalHeight` after the original image loads.
- Swipe, keyboard navigation, backdrop/escape close, focus restoration, double-click zoom, pinch zoom, and basic pan bounds.
- Full image loading starts after the opening animation and only for the active slide.

## Install

```bash
npm install ngx-image-gallery
```

## Provide defaults

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNgxImageGallery } from 'ngx-image-gallery';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxImageGallery({
      provisionalLongEdge: 1600,
      loop: true,
      closeOnEsc: true,
      closeOnBackdrop: true,
      showCounter: true,
    }),
  ],
};
```

## Template usage

```html
<div ngxImageGallery>
  <a *ngFor="let photo of photos" href="{{ photo.fullSrc }}" [ngxImageGalleryItem]="photo">
    <img [src]="photo.thumbSrc" [alt]="photo.alt" />
  </a>
</div>
```

## Item API

```ts
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
```

`width` and `height` are optional. If they are omitted, the gallery uses the rendered or natural thumbnail ratio and a provisional long edge until the original image finishes loading.

## Attribution

This package adapts selected PhotoSwipe v5 interaction and layout ideas for Angular. PhotoSwipe is MIT licensed. See `THIRD_PARTY_NOTICES.md`.
