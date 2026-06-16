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
    <section class="example-section">
      <div class="example-heading">
        <h2>Custom properties</h2>
        <p>Default lightbox structure, application-owned CSS variables.</p>
      </div>

      <div class="photo-grid css-grid" ngxImageGallery [ngxImageGallery]="options">
        @for (photo of photos; track photo.fullSrc) {
          <a class="photo-tile" [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
            <img [src]="photo.thumbSrc" [alt]="photo.alt" loading="lazy" />
          </a>
        }
      </div>
    </section>
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
