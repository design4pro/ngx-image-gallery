import { Component, signal } from '@angular/core';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryItem,
  type NgxImageGalleryOpenOptions,
} from '@design4pro/ngx-image-gallery';
import { DEMO_PHOTOS } from './demo-photos';

@Component({
  selector: 'app-dynamic-pool-gallery-example',
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    <section class="example-section">
      <div class="example-heading">
        <h2>Dynamic image pool</h2>
        <p>Switch the item set before opening the gallery.</p>
      </div>

      <div class="pool-toolbar" role="group" aria-label="Image pool">
        <button type="button" [class.pool-active]="poolName() === 'nature'" (click)="showNature()">
          Nature
        </button>
        <button type="button" [class.pool-active]="poolName() === 'coast'" (click)="showCoast()">
          Coast
        </button>
      </div>

      <div class="photo-grid" ngxImageGallery [ngxImageGallery]="options">
        @for (photo of photos(); track photo.fullSrc) {
          <a class="photo-tile" [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
            <img [src]="photo.thumbSrc" [alt]="photo.alt" loading="lazy" />
          </a>
        }
      </div>
    </section>
  `,
})
export class DynamicPoolGalleryExample {
  private readonly naturePhotos = DEMO_PHOTOS.slice(0, 3);
  private readonly coastPhotos: NgxImageGalleryItem[] = [
    DEMO_PHOTOS[3],
    DEMO_PHOTOS[4],
    DEMO_PHOTOS[5],
  ];

  protected readonly poolName = signal<'nature' | 'coast'>('nature');
  protected readonly photos = signal<NgxImageGalleryItem[]>(this.naturePhotos);
  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
  };

  protected showNature(): void {
    this.poolName.set('nature');
    this.photos.set(this.naturePhotos);
  }

  protected showCoast(): void {
    this.poolName.set('coast');
    this.photos.set(this.coastPhotos);
  }
}
