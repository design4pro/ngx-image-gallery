import { Component } from '@angular/core';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  NgxImageGalleryLightboxDirective,
  type NgxImageGalleryOpenOptions,
} from '@design4pro/ngx-image-gallery';
import { DEMO_PHOTOS } from './demo-photos';

@Component({
  selector: 'app-tailwind-gallery-example',
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryLightboxDirective,
  ],
  template: `
    <section aria-label="Tailwind gallery demo">
      <div
        ngxImageGallery
        [ngxImageGallery]="options"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <ng-template ngxImageGalleryLightbox let-gallery>
          <div
            class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4 text-white"
          >
            <div
              data-testid="tailwind-lightbox-counter"
              class="rounded-full bg-black/55 px-3 py-2 text-sm font-medium backdrop-blur-md"
              aria-live="polite"
            >
              {{ gallery.activeIndex + 1 }} / {{ gallery.count }}
            </div>

            <button
              data-testid="tailwind-lightbox-close"
              type="button"
              aria-label="Close gallery"
              class="pointer-events-auto inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/75"
              (click)="gallery.close()"
            >
              Close
            </button>
          </div>

          <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid gap-3 p-4">
            <div class="flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Show previous image"
                class="pointer-events-auto inline-flex h-10 min-w-28 items-center justify-center rounded-full bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/75 disabled:opacity-35"
                [disabled]="!gallery.canGoPrevious"
                (click)="gallery.previous()"
              >
                Previous
              </button>

              <button
                type="button"
                aria-label="Show next image"
                class="pointer-events-auto inline-flex h-10 min-w-28 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/75 disabled:opacity-35"
                [disabled]="!gallery.canGoNext"
                (click)="gallery.next()"
              >
                Next
              </button>
            </div>

            <div
              class="pointer-events-auto mx-auto flex max-w-full items-center justify-center gap-2 overflow-x-auto p-1"
              aria-label="Gallery thumbnails"
              role="toolbar"
            >
              @for (photo of gallery.items; track photo.fullSrc; let index = $index) {
                <button
                  type="button"
                  class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white/10 opacity-65 ring-offset-2 ring-offset-black transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/75"
                  [class.opacity-100]="gallery.activeIndex === index"
                  [class.ring-2]="gallery.activeIndex === index"
                  [class.ring-white]="gallery.activeIndex === index"
                  [attr.aria-current]="gallery.activeIndex === index ? 'true' : null"
                  [attr.aria-label]="
                    'Show image ' + (index + 1) + (photo.alt ? ': ' + photo.alt : '')
                  "
                  (click)="gallery.goTo(index)"
                >
                  <img class="h-full w-full object-cover" [src]="photo.thumbSrc" [alt]="''" />
                </button>
              }
            </div>
          </div>
        </ng-template>

        @for (photo of photos; track photo.fullSrc) {
          <a
            class="group relative block aspect-[4/3] overflow-hidden rounded-md bg-neutral-200 outline-none ring-offset-2 ring-offset-white transition focus-visible:ring-2 focus-visible:ring-sky-600"
            [href]="photo.fullSrc"
            [ngxImageGalleryItem]="photo"
          >
            <img
              class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.035]"
              [src]="photo.thumbSrc"
              [alt]="photo.alt"
              loading="lazy"
            />
          </a>
        }
      </div>
    </section>
  `,
})
export class TailwindGalleryExample {
  protected readonly photos = DEMO_PHOTOS.slice(2);
  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showCounter: false,
    classes: {
      overlay: 'tailwind-lightbox',
      customUi: 'tailwind-lightbox-ui',
    },
  };
}
