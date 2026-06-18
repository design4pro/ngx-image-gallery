import { Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideBookOpen, lucideLayers, lucideRoute } from '@ng-icons/lucide';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@demo/ui/badge';
import { HlmButtonImports } from '@demo/ui/button';
import { HlmIconImports } from '@demo/ui/icon';
import { HlmSeparatorImports } from '@demo/ui/separator';
import { HlmTypographyImports } from '@demo/ui/typography';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryOpenOptions,
} from '@design4pro/ngx-image-gallery';
import { DEMO_PHOTOS } from '../../examples/demo-photos';
import { CodeBlock } from '../../shared/code-block/code-block';
import { exampleCards } from '../../shared/docsite/docsite-data';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    CodeBlock,
    HlmBadgeImports,
    HlmButtonImports,
    HlmIconImports,
    HlmSeparatorImports,
    HlmTypographyImports,
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
  ],
  providers: [provideIcons({ lucideArrowRight, lucideBookOpen, lucideLayers, lucideRoute })],
  template: `
    <section class="border-b border-border bg-zinc-50">
      <div
        class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:px-8 lg:py-16"
      >
        <div class="flex min-w-0 flex-col justify-center gap-7">
          <div class="grid gap-4">
            <span hlmBadge variant="outline" class="w-fit">Angular native gallery</span>
            <h1 hlmH1 class="max-w-4xl text-balance [overflow-wrap:anywhere]">ngx-image-gallery</h1>
            <p hlmLead class="max-w-2xl text-pretty">
              A directive-first image gallery with progressive loading, gestures, keyboard
              navigation, custom lightbox chrome, CSS tokens, and optional URL state.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <a hlmBtn routerLink="/docs/installation">
              Read docs
              <ng-icon hlm size="sm" name="lucideArrowRight" />
            </a>
            <a hlmBtn variant="outline" routerLink="/examples/custom-properties"> View examples </a>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-md border bg-background p-4">
              <ng-icon hlm name="lucideLayers" class="mb-3 text-zinc-950" />
              <h2 class="text-sm font-semibold">Framework independent</h2>
              <p class="mt-2 text-sm text-muted-foreground">
                The library owns behavior. Your app owns markup and styling.
              </p>
            </div>
            <div class="rounded-md border bg-background p-4">
              <ng-icon hlm name="lucideBookOpen" class="mb-3 text-zinc-950" />
              <h2 class="text-sm font-semibold">Documented hooks</h2>
              <p class="mt-2 text-sm text-muted-foreground">
                CSS variables, class hooks, and typed options are listed in one place.
              </p>
            </div>
            <div class="rounded-md border bg-background p-4">
              <ng-icon hlm name="lucideRoute" class="mb-3 text-zinc-950" />
              <h2 class="text-sm font-semibold">Shareable lightboxes</h2>
              <p class="mt-2 text-sm text-muted-foreground">
                Use the router entrypoint when image state belongs in the URL.
              </p>
            </div>
          </div>
        </div>

        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
          <div
            class="overflow-hidden rounded-md border bg-background shadow-sm"
            ngxImageGallery
            [ngxImageGallery]="previewOptions"
          >
            <div class="grid grid-cols-2 gap-2 p-2">
              @for (photo of photos; track photo.id; let index = $index) {
                <a
                  class="group relative block overflow-hidden rounded-sm bg-zinc-100 outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-zinc-950"
                  [class.col-span-2]="index === 0"
                  [class.aspect-[16/9]]="index === 0"
                  [class.aspect-[4/3]]="index !== 0"
                  [href]="photo.fullSrc"
                  [ngxImageGalleryItem]="photo"
                >
                  <img
                    class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    [src]="photo.thumbSrc"
                    [alt]="photo.alt"
                    loading="lazy"
                  />
                </a>
              }
            </div>
          </div>

          <app-code-block [code]="quickStart" language="html" />
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid gap-2">
        <span hlmBadge variant="secondary" class="w-fit">Examples</span>
        <h2 hlmH2>Styling approaches</h2>
        <p hlmP class="max-w-2xl">
          Compare plain CSS custom properties, Tailwind utility markup, and router-close behavior.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        @for (example of examples; track example.path) {
          <a
            class="group overflow-hidden rounded-md border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
            [routerLink]="example.path"
          >
            <img
              class="aspect-[4/3] w-full object-cover"
              [src]="example.image"
              [alt]="example.title"
            />
            <div class="grid gap-2 p-4">
              <h3 class="text-base font-semibold">{{ example.title }}</h3>
              <p class="text-sm text-muted-foreground">{{ example.description }}</p>
            </div>
          </a>
        }
      </div>
    </section>

    <section class="border-t border-border bg-zinc-50/70">
      <div class="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid gap-2">
          <span hlmBadge variant="outline" class="w-fit">API shape</span>
          <h2 hlmH2>Directive markup, consumer styling</h2>
        </div>
        <hlm-separator decorative />
        <div class="grid gap-4 md:grid-cols-3">
          <p class="text-sm leading-6 text-muted-foreground">
            <code>ngxImageGallery</code> registers the item directives and opens the lightbox from
            the clicked thumbnail. The generated dialog keeps stable class hooks for global styling.
          </p>
          <p class="text-sm leading-6 text-muted-foreground">
            <code>ng-template[ngxImageGalleryLightbox]</code> replaces default controls while
            preserving image layout, focus management, gestures, and progressive loading.
          </p>
          <p class="text-sm leading-6 text-muted-foreground">
            <code>@design4pro/ngx-image-gallery/router</code> adds opt-in query-param
            synchronization without making Router a primary runtime requirement.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class HomePage {
  protected readonly examples = exampleCards;
  protected readonly photos = DEMO_PHOTOS.slice(0, 5);
  protected readonly previewOptions: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
    classes: {
      overlay: 'tailwind-lightbox',
    },
  };

  protected readonly quickStart = `<div ngxImageGallery [ngxImageGallery]="options">
  @for (photo of photos; track photo.id) {
    <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
      <img [src]="photo.thumbSrc" [alt]="photo.alt" />
    </a>
  }
</div>`;
}
