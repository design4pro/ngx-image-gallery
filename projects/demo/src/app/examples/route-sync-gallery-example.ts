import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@demo/ui/badge';
import { HlmButtonImports } from '@demo/ui/button';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryItem,
  type NgxImageGalleryOpenOptions,
} from 'ngx-image-gallery';
import {
  NgxImageGalleryRouteSyncDirective,
  type NgxImageGalleryRouteSyncOptions,
} from 'ngx-image-gallery/router';
import { DEMO_PHOTOS } from './demo-photos';

@Component({
  selector: 'app-route-sync-gallery-example',
  imports: [
    RouterLink,
    HlmBadgeImports,
    HlmButtonImports,
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryRouteSyncDirective,
  ],
  template: `
    <section class="grid gap-5" aria-label="Route synchronized gallery demo">
      <div class="flex flex-wrap items-center gap-2">
        <span hlmBadge variant="outline">URL controlled</span>
        @for (photo of photos; track photo.id) {
          <a
            hlmBtn
            variant="outline"
            size="sm"
            routerLink="/examples/route-sync"
            [queryParams]="{ image: imageId(photo, $index) }"
          >
            Open {{ photo.id }}
          </a>
        }
      </div>

      <div
        ngxImageGallery
        [ngxImageGallery]="options"
        [ngxImageGalleryRouteSync]="routeSyncOptions"
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
              ?image={{ imageId(photo, $index) }}
            </span>
          </a>
        }
      </div>
    </section>
  `,
})
export class RouteSyncGalleryExample {
  protected readonly photos = DEMO_PHOTOS.slice(3);
  protected readonly imageId = (item: NgxImageGalleryItem, index: number): string =>
    item.id ?? String(index);

  protected readonly routeSyncOptions: NgxImageGalleryRouteSyncOptions = {
    queryParam: 'image',
    id: this.imageId,
    slideNavigation: 'push',
  };

  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
    classes: {
      overlay: 'route-sync-lightbox',
    },
  };
}
