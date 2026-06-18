import { Component, input, output } from '@angular/core';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemContentDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryItem,
  type NgxImageGalleryOpenOptions,
} from '@design4pro/ngx-image-gallery';

interface GalleryInsight {
  eyebrow: string;
  title: string;
  metric: string;
  description: string;
  detail: string;
}

interface GalleryInsightItem extends NgxImageGalleryItem {
  data: GalleryInsight;
}

@Component({
  selector: 'app-gallery-insight-card',
  template: `
    <article
      class="grid h-full min-h-0 overflow-hidden rounded-md border border-white/15 bg-white text-neutral-950 shadow-2xl md:grid-cols-[minmax(0,1fr)_240px]"
    >
      <div class="grid content-between gap-8 p-6 sm:p-8">
        <div class="grid gap-3">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {{ insight().eyebrow }}
          </p>
          <h2 class="text-3xl font-semibold tracking-tight text-neutral-950">
            {{ insight().title }}
          </h2>
          <p class="max-w-xl text-sm leading-6 text-neutral-600">
            {{ insight().description }}
          </p>
        </div>

        <button
          type="button"
          class="w-fit rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
          (click)="closed.emit()"
        >
          Close panel
        </button>
      </div>

      <aside class="grid content-between gap-5 bg-neutral-950 p-6 text-white">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-white/55">Signal</p>
          <p class="mt-3 text-5xl font-semibold tracking-tight">{{ insight().metric }}</p>
        </div>
        <p class="text-sm leading-6 text-white/70">{{ insight().detail }}</p>
      </aside>
    </article>
  `,
})
export class GalleryInsightCard {
  readonly insight = input.required<GalleryInsight>();
  readonly closed = output<void>();
}

@Component({
  selector: 'app-custom-content-gallery-example',
  imports: [
    GalleryInsightCard,
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryItemContentDirective,
  ],
  template: `
    <section aria-label="Custom content gallery demo">
      <div ngxImageGallery [ngxImageGallery]="options" class="grid gap-3 md:grid-cols-2">
        @for (item of items; track item.id) {
          <button
            type="button"
            class="group grid min-h-52 content-between rounded-md border bg-background p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
            [ngxImageGalleryItem]="item"
          >
            <span class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {{ item.data.eyebrow }}
            </span>
            <span class="grid gap-3">
              <span class="text-2xl font-semibold tracking-tight">{{ item.data.title }}</span>
              <span class="text-sm leading-6 text-muted-foreground">{{
                item.data.description
              }}</span>
            </span>
            <span class="text-sm font-semibold text-foreground">Open component</span>

            <ng-template ngxImageGalleryItemContent let-item let-gallery="gallery">
              <app-gallery-insight-card [insight]="getInsight(item)" (closed)="gallery.close()" />
            </ng-template>
          </button>
        }
      </div>
    </section>
  `,
})
export class CustomContentGalleryExample {
  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: false,
    classes: {
      overlay: 'custom-content-lightbox',
    },
  };

  protected readonly items: GalleryInsightItem[] = [
    {
      id: 'conversion',
      width: 980,
      height: 620,
      alt: 'Conversion insight card',
      data: {
        eyebrow: 'Dashboard component',
        title: 'Conversion path quality',
        metric: '42%',
        description:
          'This slide is an Angular component rendered by the lightbox instead of a generated image.',
        detail:
          'The gallery still owns the dialog, focus trap, keyboard navigation, backdrop, and route-safe lifecycle.',
      },
    },
    {
      id: 'catalog',
      width: 980,
      height: 620,
      alt: 'Catalog insight card',
      data: {
        eyebrow: 'Custom slide',
        title: 'Catalog readiness',
        metric: '18',
        description:
          'Items without fullSrc can carry app data and render any component through ngxImageGalleryItemContent.',
        detail:
          'Image loading, error states, and zoom are skipped for custom content while next and previous controls remain available.',
      },
    },
  ];

  protected getInsight(item: NgxImageGalleryItem): GalleryInsight {
    return item.data as GalleryInsight;
  }
}
