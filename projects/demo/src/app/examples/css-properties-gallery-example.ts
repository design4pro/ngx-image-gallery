import { Component } from '@angular/core';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryOpenOptions,
} from 'ngx-image-gallery';
import { DEMO_PHOTOS } from './demo-photos';

@Component({
  selector: 'app-css-properties-gallery-example',
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    <section class="css-gallery-demo" aria-label="Custom properties gallery demo">
      <div class="css-gallery-grid" ngxImageGallery [ngxImageGallery]="options">
        @for (photo of photos; track photo.fullSrc) {
          <a class="css-gallery-tile" [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
            <img [src]="photo.thumbSrc" [alt]="photo.alt" loading="lazy" />
          </a>
        }
      </div>
    </section>
  `,
  styles: `
    .css-gallery-demo {
      display: block;
    }

    .css-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .css-gallery-tile {
      position: relative;
      display: block;
      min-height: 180px;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, #111827 10%, transparent);
      border-radius: 8px;
      background: #e6e8ec;
      text-decoration: none;
      aspect-ratio: 4 / 3;
    }

    .css-gallery-tile:nth-child(4) {
      aspect-ratio: 3 / 4;
      grid-row: span 2;
    }

    .css-gallery-tile img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition:
        transform 180ms ease,
        filter 180ms ease;
    }

    .css-gallery-tile:focus-visible {
      outline: 3px solid #2563eb;
      outline-offset: 3px;
    }

    .css-gallery-tile:hover img {
      transform: scale(1.035);
      filter: saturate(1.04);
    }

    @media (max-width: 560px) {
      .css-gallery-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class CssPropertiesGalleryExample {
  protected readonly photos = DEMO_PHOTOS.slice(0, 4);
  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
    classes: {
      overlay: 'css-properties-lightbox',
    },
  };
}
