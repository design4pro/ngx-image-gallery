import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@demo/ui/badge';
import { HlmButtonImports } from '@demo/ui/button';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryOpenOptions,
} from 'ngx-image-gallery';
import {
  NgxImageGalleryCloseOnNavigationDirective,
  type NgxImageGalleryCloseOnNavigationOptions,
} from 'ngx-image-gallery/router';
import { DEMO_PHOTOS } from './demo-photos';

@Component({
  selector: 'app-router-close-gallery-example',
  imports: [
    RouterLink,
    HlmBadgeImports,
    HlmButtonImports,
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryCloseOnNavigationDirective,
  ],
  template: `
    <section class="grid gap-5" aria-label="Router close gallery demo">
      <div class="flex flex-wrap items-center gap-2">
        <span hlmBadge variant="outline">Router close</span>
        <a hlmBtn variant="outline" size="sm" routerLink="/examples/custom-properties">
          Change route
        </a>
        <a hlmBtn variant="outline" size="sm" routerLink="/docs/router-close">Docs</a>
      </div>

      <div
        ngxImageGallery
        [ngxImageGallery]="options"
        [ngxImageGalleryCloseOnNavigation]="closeOnNavigation"
        class="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        @for (photo of photos; track photo.id) {
          <a
            class="group relative block aspect-[3/4] overflow-hidden rounded-md border bg-zinc-100 outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-zinc-950"
            [href]="photo.fullSrc"
            [ngxImageGalleryItem]="photo"
          >
            <img
              class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.035]"
              [src]="photo.thumbSrc"
              [alt]="photo.alt"
              loading="lazy"
            />
            <span
              class="absolute inset-x-3 bottom-3 rounded-md bg-white/85 px-2 py-1 text-xs font-medium text-zinc-950 shadow-sm backdrop-blur"
            >
              {{ photo.id }}
            </span>
          </a>
        }
      </div>
    </section>
  `,
})
export class RouterCloseGalleryExample {
  protected readonly photos = DEMO_PHOTOS.slice(3);

  protected readonly closeOnNavigation: NgxImageGalleryCloseOnNavigationOptions = {
    closeOnNavigation: true,
    closeOnHistoryBack: true,
  };

  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
    classes: {
      overlay: 'router-close-lightbox',
    },
  };
}
