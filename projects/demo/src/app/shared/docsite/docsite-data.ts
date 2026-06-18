export interface NavItem {
  label: string;
  path: string;
}

export interface ExampleCard {
  title: string;
  description: string;
  path: string;
  image: string;
}

export interface CodeSnippet {
  language: 'html' | 'ts' | 'css' | 'bash' | 'yaml';
  code: string;
}

export interface DocSection {
  title: string;
  body: string;
  code?: CodeSnippet;
}

export interface ApiOption {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  sections: DocSection[];
}

export const primaryNav: NavItem[] = [
  { label: 'Examples', path: '/examples/custom-properties' },
  { label: 'Docs', path: '/docs/installation' },
  { label: 'Options', path: '/docs/options' },
];

export const exampleCards: ExampleCard[] = [
  {
    title: 'Custom properties',
    description: 'A gallery styled with plain CSS classes and library tokens.',
    path: '/examples/custom-properties',
    image: 'https://picsum.photos/id/1015/960/720',
  },
  {
    title: 'Tailwind 4',
    description: 'Consumer-owned layout and lightbox chrome with Tailwind utilities.',
    path: '/examples/tailwind',
    image: 'https://picsum.photos/id/1043/960/720',
  },
  {
    title: 'Custom content',
    description: 'Render Angular components in lightbox slides without full image sources.',
    path: '/examples/custom-content',
    image: 'https://picsum.photos/id/1067/960/720',
  },
  {
    title: 'Router close',
    description: 'Close an open lightbox when the application route changes.',
    path: '/examples/router-close',
    image: 'https://picsum.photos/id/1050/720/960',
  },
];

export const optionGroups: Array<{ title: string; options: ApiOption[] }> = [
  {
    title: 'Gallery options',
    options: [
      {
        name: 'provisionalLongEdge',
        type: 'number',
        defaultValue: '1600',
        description: 'Long edge used while dimensions are inferred from the thumbnail.',
      },
      {
        name: 'loop',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Allows previous and next navigation to wrap around.',
      },
      {
        name: 'closeOnEsc',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Closes the dialog when Escape is pressed.',
      },
      {
        name: 'closeOnBackdrop',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Closes the dialog when the backdrop is clicked.',
      },
      {
        name: 'showCounter',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Shows the default current slide counter.',
      },
      {
        name: 'showThumbnails',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Shows the default thumbnail toolbar in the lightbox.',
      },
      {
        name: 'classes',
        type: 'NgxImageGalleryClasses',
        defaultValue: '{}',
        description: 'Adds classes to generated elements while preserving structural hooks.',
      },
      {
        name: 'labels',
        type: 'NgxImageGalleryLabelsInput',
        defaultValue: 'English labels',
        description: 'Overrides generated dialog, control, counter, status, and thumbnail labels.',
      },
    ],
  },
  {
    title: 'Item options',
    options: [
      {
        name: 'fullSrc',
        type: 'string',
        defaultValue: 'required for image slides',
        description:
          'Application-owned original image URL. Omit only when the item provides ngxImageGalleryItemContent.',
      },
      {
        name: 'thumbSrc',
        type: 'string',
        defaultValue: 'fullSrc',
        description: 'Application-owned thumbnail URL used in previews and thumbnail controls.',
      },
      {
        name: 'alt',
        type: 'string',
        defaultValue: "''",
        description: 'Image text for thumbnails, lightbox media, slide labels, and controls.',
      },
      {
        name: 'srcset',
        type: 'string',
        defaultValue: 'undefined',
        description:
          'Responsive source set for the loaded full-size image. Unsafe lists are ignored.',
      },
      {
        name: 'sizes',
        type: 'string',
        defaultValue: 'undefined',
        description: 'Sizes hint paired with srcset.',
      },
      {
        name: 'width / height',
        type: 'number',
        defaultValue: 'optional',
        description: 'Known full image dimensions. The gallery can infer them when omitted.',
      },
      {
        name: 'thumbCropped',
        type: 'boolean',
        defaultValue: 'auto',
        description: 'Controls cropped thumbnail origin animation handling.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'optional',
        description: 'Stable item id for custom app logic.',
      },
      {
        name: 'data',
        type: 'unknown',
        defaultValue: 'undefined',
        description: 'Application metadata carried with the gallery item.',
      },
    ],
  },
  {
    title: 'Router close options',
    options: [
      {
        name: 'closeOnNavigation',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Closes the owned lightbox when Angular Router starts a navigation.',
      },
      {
        name: 'closeOnHistoryBack',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Closes the owned lightbox for browser history navigations when route-wide closing is disabled.',
      },
    ],
  },
];

export const classHooks = [
  'overlay',
  'backdrop',
  'stage',
  'track',
  'ui',
  'defaultUi',
  'customUi',
  'button',
  'closeButton',
  'previousButton',
  'nextButton',
  'counter',
  'thumbnails',
  'thumbnailButton',
  'thumbnailImage',
  'loading',
  'error',
];

export const cssTokens = [
  '--ngx-image-gallery-z-index',
  '--ngx-image-gallery-color',
  '--ngx-image-gallery-font-family',
  '--ngx-image-gallery-backdrop-background',
  '--ngx-image-gallery-backdrop-transition',
  '--ngx-image-gallery-media-transition',
  '--ngx-image-gallery-full-image-transition',
  '--ngx-image-gallery-ui-transition',
  '--ngx-image-gallery-control-color',
  '--ngx-image-gallery-control-background',
  '--ngx-image-gallery-control-border-radius',
  '--ngx-image-gallery-control-size',
  '--ngx-image-gallery-control-offset',
  '--ngx-image-gallery-control-focus-outline',
  '--ngx-image-gallery-counter-padding',
  '--ngx-image-gallery-counter-font-size',
  '--ngx-image-gallery-thumbnails-gap',
  '--ngx-image-gallery-thumbnails-padding',
  '--ngx-image-gallery-thumbnail-size',
  '--ngx-image-gallery-thumbnail-border',
  '--ngx-image-gallery-thumbnail-active-border-color',
  '--ngx-image-gallery-thumbnail-border-radius',
  '--ngx-image-gallery-thumbnail-background',
  '--ngx-image-gallery-thumbnail-opacity',
  '--ngx-image-gallery-thumbnail-active-opacity',
  '--ngx-image-gallery-status-background',
  '--ngx-image-gallery-status-border-radius',
  '--ngx-image-gallery-status-padding',
  '--ngx-image-gallery-status-font-size',
];

export const docs: DocPage[] = [
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Install the library, provide defaults, and keep styling in the app.',
    sections: [
      {
        title: 'Install the package',
        body: 'The runtime package is Angular-only and has no dependency on third-party UI frameworks. Tailwind, Spartan, and app design systems stay outside the library.',
        code: {
          language: 'bash',
          code: 'npm install ngx-image-gallery',
        },
      },
      {
        title: 'Provide defaults',
        body: 'Defaults are optional. Local gallery options still override provider values.',
        code: {
          language: 'ts',
          code: `import { ApplicationConfig } from '@angular/core';
import { provideNgxImageGallery } from 'ngx-image-gallery';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxImageGallery({
      provisionalLongEdge: 1600,
      showThumbnails: true,
      classes: {
        overlay: 'brand-lightbox',
      },
    }),
  ],
};`,
        },
      },
    ],
  },
  {
    slug: 'usage',
    title: 'Usage',
    description: 'Use standalone directives on the markup your application already owns.',
    sections: [
      {
        title: 'Directive markup',
        body: 'The gallery directive registers item directives and opens the lightbox from the clicked origin element.',
        code: {
          language: 'html',
          code: `<div ngxImageGallery [ngxImageGallery]="galleryOptions">
  @for (photo of photos; track photo.fullSrc) {
    <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
      <img [src]="photo.thumbSrc" [alt]="photo.alt" />
    </a>
  }
</div>`,
        },
      },
      {
        title: 'Item data',
        body: 'Image slides require fullSrc. Items that provide ngxImageGalleryItemContent may omit fullSrc and render application data instead.',
        code: {
          language: 'ts',
          code: `import type { NgxImageGalleryItem } from 'ngx-image-gallery';

export const photos: NgxImageGalleryItem[] = [
  {
    id: 'mountain',
    fullSrc: '/photos/mountain-full.jpg',
    thumbSrc: '/photos/mountain-thumb.jpg',
    alt: 'Mountain valley with a river',
  },
];`,
        },
      },
      {
        title: 'Image URL boundary',
        body: 'Gallery image URLs are application-owned data. The library assigns only relative URLs, HTTP(S) URLs, blob URLs, and common raster data:image URLs for single image sources; unsafe schemes are ignored. Use relative, HTTP(S), or blob candidates in srcset because an unsafe candidate drops the whole srcset value.',
      },
    ],
  },
  {
    slug: 'options',
    title: 'Options',
    description: 'Every public option grouped by behavior area.',
    sections: [
      {
        title: 'Provider and open options',
        body: 'Most options can be supplied globally through provideNgxImageGallery or locally through the gallery input.',
      },
    ],
  },
  {
    slug: 'styling',
    title: 'Styling',
    description: 'Use CSS custom properties, class hooks, or your own template.',
    sections: [
      {
        title: 'Custom properties',
        body: 'Attach a class through options and override gallery tokens in global CSS.',
        code: {
          language: 'css',
          code: `.brand-lightbox {
  --ngx-image-gallery-backdrop-background: rgb(5 10 20 / 92%);
  --ngx-image-gallery-control-background: rgb(255 255 255 / 16%);
  --ngx-image-gallery-control-border-radius: 999px;
  --ngx-image-gallery-thumbnail-active-border-color: #38bdf8;
}`,
        },
      },
      {
        title: 'Configured classes',
        body: 'Configured classes are additive. Structural ngx-image-gallery class hooks remain present.',
        code: {
          language: 'ts',
          code: `readonly galleryOptions = {
  classes: {
    overlay: 'brand-lightbox',
    closeButton: 'brand-lightbox-close',
    thumbnailButton: 'brand-lightbox-thumb',
  },
};`,
        },
      },
    ],
  },
  {
    slug: 'custom-lightbox',
    title: 'Custom lightbox',
    description: 'Replace controls or render custom Angular content in individual slides.',
    sections: [
      {
        title: 'Template context',
        body: 'The template receives state and commands. The image stage remains owned by the library.',
        code: {
          language: 'html',
          code: `<div ngxImageGallery>
  <ng-template ngxImageGalleryLightbox let-gallery>
    <button type="button" (click)="gallery.previous()" [disabled]="!gallery.canGoPrevious">
      Previous
    </button>
    <span>{{ gallery.activeIndex + 1 }} / {{ gallery.count }}</span>
    <button type="button" (click)="gallery.next()" [disabled]="!gallery.canGoNext">
      Next
    </button>
    <button type="button" (click)="gallery.close()">Close</button>
  </ng-template>
</div>`,
        },
      },
      {
        title: 'Custom item content',
        body: 'Place ng-template[ngxImageGalleryItemContent] inside an item directive to render Angular content in that slide instead of the generated image. Custom content keeps dialog behavior, focus trapping, and navigation, but skips image loading, image error state, and zoom.',
        code: {
          language: 'html',
          code: `<button type="button" [ngxImageGalleryItem]="insightItem">
  Open insight

  <ng-template ngxImageGalleryItemContent let-item let-gallery="gallery">
    <app-insight-panel
      [insight]="item.data"
      (closed)="gallery.close()"
    />
  </ng-template>
</button>`,
        },
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    description: 'Default dialog semantics, keyboard support, labels, and custom template duties.',
    sections: [
      {
        title: 'Default lightbox',
        body: 'The generated lightbox uses a modal dialog, moves focus inside on open, traps focus in lightbox controls, marks existing body siblings inert and aria-hidden, locks body scrolling, restores connected opener focus on close, hides inactive slides from assistive technology, and announces loading or error states.',
      },
      {
        title: 'Keyboard support',
        body: 'The default controls support Escape close, ArrowLeft and ArrowRight navigation, Tab focus trapping, plus or equals to zoom in, minus to zoom out, and zero to reset zoom.',
      },
      {
        title: 'Labels',
        body: 'Use the labels option to localize generated UI text. Label values are assigned as text content or ARIA attributes, never as HTML.',
        code: {
          language: 'ts',
          code: `readonly galleryOptions = {
  labels: {
    dialog: 'Product image gallery',
    closeButton: 'Close product gallery',
    counter: (current: number, total: number) => \`Image \${current} of \${total}\`,
    thumbnailButton: (item: NgxImageGalleryItem, index: number, total: number) =>
      item.alt
        ? \`Show image \${index + 1} of \${total}: \${item.alt}\`
        : \`Show image \${index + 1} of \${total}\`,
  },
};`,
        },
      },
      {
        title: 'Custom templates',
        body: 'When a custom lightbox template replaces default controls, the app owns those controls semantics. Prefer native buttons, label icon-only controls, expose changing counters with aria-live, and keep item alt text meaningful.',
      },
      {
        title: 'Color contrast',
        body: 'Automated jsdom accessibility smoke tests do not measure rendered contrast. Verify contrast in a browser when changing default colors or theme tokens.',
      },
    ],
  },
  {
    slug: 'router-close',
    title: 'Router close',
    description: 'Use a secondary entrypoint when route changes should close an open lightbox.',
    sections: [
      {
        title: 'Close on navigation',
        body: 'Router close is opt-in. It does not write query params or open slides from the URL; it only closes the gallery-owned lightbox when Router navigation starts.',
        code: {
          language: 'html',
          code: `<div
  ngxImageGallery
  [ngxImageGalleryCloseOnNavigation]="{
    closeOnNavigation: true,
    closeOnHistoryBack: true,
  }"
>
  @for (photo of photos; track photo.id) {
    <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
      <img [src]="photo.thumbSrc" [alt]="photo.alt" />
    </a>
  }
</div>`,
        },
      },
      {
        title: 'Import the secondary entrypoint',
        body: 'The router integration is outside the primary entrypoint so core gallery consumers do not need Router.',
        code: {
          language: 'ts',
          code: `import { NgxImageGalleryCloseOnNavigationDirective } from 'ngx-image-gallery/router';

readonly closeOnNavigation = {
  closeOnNavigation: true,
  closeOnHistoryBack: true,
};`,
        },
      },
    ],
  },
];
