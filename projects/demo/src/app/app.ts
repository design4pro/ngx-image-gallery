import { Component, signal } from '@angular/core';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  NgxImageGalleryLightboxDirective,
  type NgxImageGalleryItem,
  type NgxImageGalleryOpenOptions,
} from 'ngx-image-gallery';

@Component({
  selector: 'app-root',
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryLightboxDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('ngx-image-gallery');
  protected readonly photos: NgxImageGalleryItem[] = [
    {
      fullSrc: 'https://picsum.photos/id/1015/2400/1600',
      thumbSrc: 'https://picsum.photos/id/1015/480/320',
      alt: 'Mountain valley with a river',
    },
    {
      fullSrc: 'https://picsum.photos/id/1039/2400/1800',
      thumbSrc: 'https://picsum.photos/id/1039/480/360',
      alt: 'Waterfall in a forest',
    },
    {
      fullSrc: 'https://picsum.photos/id/1043/2400/1500',
      thumbSrc: 'https://picsum.photos/id/1043/480/300',
      alt: 'Lake beside mountains',
    },
    {
      fullSrc: 'https://picsum.photos/id/1050/1800/2400',
      thumbSrc: 'https://picsum.photos/id/1050/360/480',
      alt: 'Portrait-oriented coastline',
    },
    {
      fullSrc: 'https://picsum.photos/id/1067/2400/1600',
      thumbSrc: 'https://picsum.photos/id/1067/480/320',
      alt: 'Rocky beach at dusk',
    },
    {
      fullSrc: 'https://picsum.photos/id/1084/2400/1600',
      thumbSrc: 'https://picsum.photos/id/1084/480/320',
      alt: 'Snowy mountain ridge',
    },
  ];
  protected readonly cssPhotos = this.photos.slice(0, 4);
  protected readonly tailwindPhotos = this.photos.slice(2);

  protected readonly cssPropertiesOptions: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
    classes: {
      overlay: 'css-properties-lightbox',
    },
  };

  protected readonly tailwindOptions: Partial<NgxImageGalleryOpenOptions> = {
    showCounter: false,
    classes: {
      overlay: 'tailwind-lightbox',
      customUi: 'tailwind-lightbox-ui',
    },
  };
}
