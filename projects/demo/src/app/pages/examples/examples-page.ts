import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@demo/ui/badge';
import { HlmButtonImports } from '@demo/ui/button';
import { HlmSeparatorImports } from '@demo/ui/separator';
import { HlmTypographyImports } from '@demo/ui/typography';
import { map } from 'rxjs';
import { CssPropertiesGalleryExample } from '../../examples/css-properties-gallery-example';
import { RouterCloseGalleryExample } from '../../examples/router-close-gallery-example';
import { TailwindGalleryExample } from '../../examples/tailwind-gallery-example';
import { CodeBlock } from '../../shared/code-block/code-block';
import { exampleCards } from '../../shared/docsite/docsite-data';

type ExampleSlug = 'custom-properties' | 'tailwind' | 'router-close';

const EXAMPLE_COPY: Record<
  ExampleSlug,
  {
    eyebrow: string;
    title: string;
    description: string;
    snippet: string;
    language: 'html' | 'css' | 'ts';
  }
> = {
  'custom-properties': {
    eyebrow: 'Pure CSS demo',
    title: 'Custom properties',
    description:
      'The page shell uses Spartan and Tailwind, but the actual gallery below is semantic HTML, local SCSS, and ngx-image-gallery CSS variables only.',
    language: 'css',
    snippet: `.css-properties-lightbox {
  --ngx-image-gallery-backdrop-background: color-mix(in srgb, #09111f 88%, transparent);
  --ngx-image-gallery-control-background: color-mix(in srgb, #f8fafc 16%, transparent);
  --ngx-image-gallery-thumbnail-active-border-color: #38bdf8;
}`,
  },
  tailwind: {
    eyebrow: 'Utility styled',
    title: 'Tailwind 4',
    description:
      'Consumer markup uses Tailwind utilities for thumbnails and a custom lightbox template.',
    language: 'html',
    snippet: `<div ngxImageGallery [ngxImageGallery]="options" class="grid grid-cols-2 gap-3">
  <ng-template ngxImageGalleryLightbox let-gallery>
    <button type="button" (click)="gallery.close()">Close</button>
  </ng-template>
</div>`,
  },
  'router-close': {
    eyebrow: 'Router close',
    title: 'Close on navigation',
    description:
      'Keep lightbox state local to the gallery, but close it when the application route changes or browser history moves.',
    language: 'ts',
    snippet: `readonly closeOnNavigation = {
  closeOnNavigation: true,
  closeOnHistoryBack: true,
};`,
  },
};

@Component({
  selector: 'app-examples-page',
  imports: [
    RouterLink,
    CodeBlock,
    CssPropertiesGalleryExample,
    RouterCloseGalleryExample,
    TailwindGalleryExample,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSeparatorImports,
    HlmTypographyImports,
  ],
  template: `
    <section class="border-b border-border bg-zinc-50/80">
      <div class="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a routerLink="/" class="hover:text-foreground">Home</a>
          <span>/</span>
          <span>Examples</span>
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div class="grid gap-3">
            <span hlmBadge variant="outline" class="w-fit">{{ copy().eyebrow }}</span>
            <h1 hlmH1>{{ copy().title }}</h1>
            <p hlmLead class="max-w-3xl">{{ copy().description }}</p>
          </div>

          <nav class="flex flex-wrap gap-2" aria-label="Example routes">
            @for (example of examples; track example.path) {
              <a hlmBtn variant="outline" size="sm" [routerLink]="example.path">
                {{ example.title }}
              </a>
            }
          </nav>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
        <div class="min-w-0">
          @switch (slug()) {
            @case ('tailwind') {
              <app-tailwind-gallery-example />
            }
            @case ('router-close') {
              <app-router-close-gallery-example />
            }
            @default {
              <app-css-properties-gallery-example />
            }
          }
        </div>

        <aside class="grid content-start gap-4">
          <div class="rounded-md border bg-background p-4">
            <h2 class="text-sm font-semibold">Implementation note</h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Examples are regular consumer code. The library package does not import Spartan,
              Tailwind, Angular CDK overlay, or another UI framework.
            </p>
          </div>

          <app-code-block [code]="copy().snippet" [language]="copy().language" />
        </aside>
      </div>

      <hlm-separator decorative />

      <div class="grid gap-4 md:grid-cols-3">
        @for (example of examples; track example.path) {
          <a
            class="group overflow-hidden rounded-md border bg-background transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
            [routerLink]="example.path"
          >
            <img
              class="aspect-[4/3] w-full object-cover"
              [src]="example.image"
              [alt]="example.title"
            />
            <div class="grid gap-2 p-4">
              <h3 class="text-sm font-semibold">{{ example.title }}</h3>
              <p class="text-sm text-muted-foreground">{{ example.description }}</p>
            </div>
          </a>
        }
      </div>
    </section>
  `,
})
export class ExamplesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly routeSlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? 'custom-properties')),
    { initialValue: 'custom-properties' },
  );

  protected readonly examples = exampleCards;
  protected readonly slug = computed<ExampleSlug>(() => {
    const slug = this.routeSlug();
    return slug === 'tailwind' || slug === 'router-close' ? slug : 'custom-properties';
  });
  protected readonly copy = computed(() => EXAMPLE_COPY[this.slug()]);
}
