# @design4pro/ngx-image-gallery

[![Angular 20–22](https://img.shields.io/badge/Angular-20--22-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![GitHub release](https://img.shields.io/github/v/release/design4pro/ngx-image-gallery)](https://github.com/design4pro/ngx-image-gallery/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A native Angular image gallery with a responsive lightbox, progressive image loading, touch gestures, zoom, and accessible defaults.

[Live demo](https://design4pro.github.io/ngx-image-gallery/) ·
[Documentation](https://design4pro.github.io/ngx-image-gallery/docs/installation) ·
[Examples](https://design4pro.github.io/ngx-image-gallery/examples/custom-properties) ·
[Releases](https://github.com/design4pro/ngx-image-gallery/releases)

## Why ngx-image-gallery?

- Standalone Angular directives with a small, typed API.
- Smooth lightbox opening from the selected thumbnail.
- Progressive loading: the thumbnail is shown first and the full image loads after the opening animation.
- Swipe navigation, pinch and wheel zoom, double-click zoom, and bounded panning.
- Accessible modal dialog behavior, keyboard navigation, focus trapping, focus restoration, and reduced-motion support.
- Optional counters, thumbnail navigation, custom controls, and custom Angular slide content.
- CSS custom properties and stable class hooks for consumer-owned styling.
- Opt-in enhancement of trusted article or CMS-rendered image markup.
- Optional Angular Router integration through a secondary entrypoint.
- No runtime dependency on PhotoSwipe, Angular Material, Tailwind, Bootstrap, CDK Overlay, or another UI framework.

## Compatibility

| Dependency        | Supported version            |
| ----------------- | ---------------------------- |
| `@angular/core`   | `>=20.0.0 <23.0.0`           |
| `@angular/common` | `>=20.0.0 <23.0.0`           |
| `@angular/router` | `>=20.0.0 <23.0.0`, optional |

The package is standalone-first and does not provide an `NgModule`. Angular Router is required only when importing from `@design4pro/ngx-image-gallery/router`.

## Installation

The package is published to GitHub Packages. Configure the `@design4pro` scope in your project-level `.npmrc`:

```ini
@design4pro:registry=https://npm.pkg.github.com
```

Authenticate with your GitHub username and a classic personal access token with `read:packages` permission:

```bash
npm login --scope=@design4pro --auth-type=legacy --registry=https://npm.pkg.github.com
```

Then install the package:

```bash
npm install @design4pro/ngx-image-gallery
```

See [GitHub Packages authentication](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) for CI and organization-specific setup.

## Quick start

Import the gallery and item directives into a standalone component, then describe each image with a typed item.

```ts
import { Component } from '@angular/core';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
  type NgxImageGalleryItem,
  type NgxImageGalleryOptionsInput,
} from '@design4pro/ngx-image-gallery';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  templateUrl: './photo-gallery.component.html',
})
export class PhotoGalleryComponent {
  readonly photos: NgxImageGalleryItem[] = [
    {
      id: 'mountain-lake',
      fullSrc: '/photos/mountain-lake-full.jpg',
      thumbSrc: '/photos/mountain-lake-thumb.jpg',
      alt: 'Mountain lake at sunrise',
      width: 2400,
      height: 1600,
    },
    {
      id: 'forest-path',
      fullSrc: '/photos/forest-path-full.jpg',
      thumbSrc: '/photos/forest-path-thumb.jpg',
      alt: 'Forest path after rain',
      width: 2400,
      height: 1600,
    },
  ];

  readonly galleryOptions: NgxImageGalleryOptionsInput = {
    showThumbnails: true,
  };
}
```

```angular
<div ngxImageGallery [ngxImageGallery]="galleryOptions">
  @for (photo of photos; track photo.id) {
    <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
      <img [src]="photo.thumbSrc" [alt]="photo.alt" />
    </a>
  }
</div>
```

The anchor keeps a useful native fallback and still supports modified clicks such as <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + click. No gallery stylesheet import is required; the library supplies minimal default lightbox styles when the first gallery opens.

For a single image, the item directive can also receive a source string:

```html
<div ngxImageGallery>
  <button type="button" [ngxImageGalleryItem]="'/photos/full.jpg'">Open image</button>
</div>
```

## Configuration

Options can be set globally with `provideNgxImageGallery()` and overridden by an individual gallery. Nested `classes` and `labels` values are merged, so local values only replace the keys they define.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNgxImageGallery } from '@design4pro/ngx-image-gallery';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxImageGallery({
      loop: true,
      closeOnEsc: true,
      closeOnBackdrop: true,
      showCounter: true,
      showThumbnails: false,
      labels: {
        dialog: 'Product image gallery',
      },
      classes: {
        overlay: 'brand-lightbox',
      },
    }),
  ],
};
```

### Gallery options

| Option                | Type                         | Default          | Description                                                                 |
| --------------------- | ---------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `provisionalLongEdge` | `number`                     | `1600`           | Long edge used while full image dimensions are inferred from the thumbnail. |
| `loop`                | `boolean`                    | `true`           | Wraps previous and next navigation around the item list.                    |
| `closeOnEsc`          | `boolean`                    | `true`           | Closes the lightbox when <kbd>Escape</kbd> is pressed.                      |
| `closeOnBackdrop`     | `boolean`                    | `true`           | Closes the lightbox when the backdrop is clicked.                           |
| `showCounter`         | `boolean`                    | `true`           | Shows the default current-item counter.                                     |
| `showThumbnails`      | `boolean`                    | `false`          | Shows the default thumbnail strip.                                          |
| `classes`             | `NgxImageGalleryClasses`     | `{}`             | Adds consumer classes while preserving structural gallery classes.          |
| `labels`              | `NgxImageGalleryLabelsInput` | English defaults | Localizes or customizes generated dialog, control, status, and item labels. |

### Gallery item

```ts
export interface NgxImageGalleryItem {
  fullSrc?: string;
  thumbSrc?: string;
  alt?: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
  thumbCropped?: boolean;
  id?: string;
  data?: unknown;
}
```

| Property       | Description                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `fullSrc`      | Full-size image URL. Required for image slides; omit only for a slide with `ngxImageGalleryItemContent`.    |
| `thumbSrc`     | Thumbnail URL used during progressive loading and in the optional thumbnail strip. Falls back to `fullSrc`. |
| `alt`          | Alternative text used by lightbox images and accessible controls. Use `''` only for decorative images.      |
| `srcset`       | Responsive candidates for the full-size image.                                                              |
| `sizes`        | Responsive sizes hint paired with `srcset`.                                                                 |
| `width`        | Known full-size image width. Optional; the gallery can infer dimensions.                                    |
| `height`       | Known full-size image height. Optional; the gallery can infer dimensions.                                   |
| `thumbCropped` | Controls whether the opening animation treats the rendered thumbnail as cropped.                            |
| `id`           | Stable item identifier. Required when using shareable URL state.                                            |
| `data`         | Application-owned metadata, available to custom slide templates.                                            |

### Programmatic open and close

The gallery directive exports itself as `ngxImageGallery`:

```angular
<div ngxImageGallery #gallery="ngxImageGallery">
  @for (photo of photos; track photo.id) {
    <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
      <img [src]="photo.thumbSrc" [alt]="photo.alt" />
    </a>
  }
</div>

<button type="button" (click)="gallery.open(1)">Open the second image</button>
```

Available methods are `open(index = 0)`, `close(animate = true)`, `getItems()`, and `ownsActiveLightbox()`.

## Auto-discover existing image markup

Use `ngxImageGalleryAuto` to progressively enhance trusted markup that already contains linked or standalone images, such as an application-rendered article, Markdown document, or CMS page.

```ts
import {
  NgxImageGalleryAutoDirective,
  NgxImageGalleryDirective,
} from '@design4pro/ngx-image-gallery';

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryAutoDirective],
  // ...
})
export class ArticleComponent {}
```

```html
<article ngxImageGallery ngxImageGalleryAuto>
  <a href="/photos/forest-full.jpg">
    <img src="/photos/forest-thumb.jpg" alt="Forest path after rain" />
  </a>

  <img src="/photos/harbor.jpg" alt="Harbor at sunrise" />
</article>
```

Linked images use the anchor `href` as `fullSrc`. Standalone images use their own `src` and must have an accessible name through `alt`, `aria-label`, or `aria-labelledby`. Explicit `ngxImageGalleryItem` directives take precedence and are not registered twice.

Auto-discovery is intentionally conservative:

- It inspects the markup once after the view initializes; it does not observe future DOM mutations.
- It handles linked and standalone images only.
- It does not parse HTML strings or sanitize untrusted content.
- It ignores download links and standalone images without an accessible name.

Use explicit item directives for structured Angular templates or dynamic collections.

## Styling

The default lightbox is deliberately minimal. Style thumbnail layout in your own component and customize generated lightbox elements with CSS custom properties or additive classes.

### CSS custom properties

Attach a class to the generated overlay and override tokens in global CSS:

```ts
readonly galleryOptions: NgxImageGalleryOptionsInput = {
  classes: {
    overlay: 'brand-lightbox',
  },
};
```

```css
.brand-lightbox {
  --ngx-image-gallery-z-index: 1200;
  --ngx-image-gallery-backdrop-background: rgb(5 10 20 / 92%);
  --ngx-image-gallery-control-background: rgb(255 255 255 / 16%);
  --ngx-image-gallery-control-border-radius: 999px;
  --ngx-image-gallery-control-focus-outline: 2px solid #38bdf8;
  --ngx-image-gallery-thumbnail-active-border-color: #38bdf8;
}
```

Supported tokens:

| Area       | CSS custom properties                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation | `--ngx-image-gallery-z-index`, `--ngx-image-gallery-color`, `--ngx-image-gallery-font-family`                                                                                                                                                                                                                                                                                                         |
| Backdrop   | `--ngx-image-gallery-backdrop-background`, `--ngx-image-gallery-backdrop-transition`                                                                                                                                                                                                                                                                                                                  |
| Motion     | `--ngx-image-gallery-media-transition`, `--ngx-image-gallery-full-image-transition`, `--ngx-image-gallery-ui-transition`                                                                                                                                                                                                                                                                              |
| Controls   | `--ngx-image-gallery-control-color`, `--ngx-image-gallery-control-background`, `--ngx-image-gallery-control-border-radius`, `--ngx-image-gallery-control-size`, `--ngx-image-gallery-control-offset`, `--ngx-image-gallery-control-focus-outline`                                                                                                                                                     |
| Counter    | `--ngx-image-gallery-counter-padding`, `--ngx-image-gallery-counter-font-size`                                                                                                                                                                                                                                                                                                                        |
| Thumbnails | `--ngx-image-gallery-thumbnails-gap`, `--ngx-image-gallery-thumbnails-padding`, `--ngx-image-gallery-thumbnail-size`, `--ngx-image-gallery-thumbnail-border`, `--ngx-image-gallery-thumbnail-active-border-color`, `--ngx-image-gallery-thumbnail-border-radius`, `--ngx-image-gallery-thumbnail-background`, `--ngx-image-gallery-thumbnail-opacity`, `--ngx-image-gallery-thumbnail-active-opacity` |
| Status     | `--ngx-image-gallery-status-background`, `--ngx-image-gallery-status-border-radius`, `--ngx-image-gallery-status-padding`, `--ngx-image-gallery-status-font-size`                                                                                                                                                                                                                                     |

### Configured classes

Each `classes` value accepts a class string or an array of class strings. Configured classes are additive and never remove the stable `ngx-image-gallery-*` structural classes.

```ts
readonly galleryOptions: NgxImageGalleryOptionsInput = {
  classes: {
    overlay: 'brand-lightbox',
    button: ['button-reset', 'brand-lightbox-button'],
    closeButton: 'brand-lightbox-close',
    thumbnailButton: 'brand-lightbox-thumbnail',
  },
};
```

Available class targets: `overlay`, `backdrop`, `stage`, `track`, `ui`, `defaultUi`, `customUi`, `button`, `closeButton`, `previousButton`, `nextButton`, `counter`, `thumbnails`, `thumbnailButton`, `thumbnailImage`, `loading`, and `error`.

Tailwind and other utility frameworks can be used in consumer templates or through configured classes; they are not required by the library.

## Custom lightbox controls

Place `ng-template[ngxImageGalleryLightbox]` inside the gallery to replace the default controls. The library continues to own the modal dialog, image stage, progressive loading, gestures, navigation, and focus management.

Import `NgxImageGalleryLightboxDirective` into the standalone component, then provide the template:

```html
<div ngxImageGallery>
  <ng-template ngxImageGalleryLightbox let-gallery>
    <button type="button" (click)="gallery.previous()" [disabled]="!gallery.canGoPrevious">
      Previous
    </button>

    <span aria-live="polite">{{ gallery.activeIndex + 1 }} / {{ gallery.count }}</span>

    <button type="button" (click)="gallery.next()" [disabled]="!gallery.canGoNext">Next</button>
    <button type="button" (click)="gallery.close()">Close</button>
  </ng-template>

  <!-- gallery items -->
</div>
```

The implicit `NgxImageGalleryLightboxContext` provides:

| Value                                            | Description                               |
| ------------------------------------------------ | ----------------------------------------- |
| `items`, `activeItem`, `activeIndex`, `count`    | Current item collection and position.     |
| `state`, `isOpen`, `isLoading`, `hasError`       | Current lightbox and loading state.       |
| `canGoPrevious`, `canGoNext`                     | Navigation availability after loop rules. |
| `previous()`, `next()`, `goTo(index)`, `close()` | Commands for custom controls.             |

Custom controls own their accessibility semantics. Prefer native buttons, label icon-only controls, and announce changing status or counters where appropriate.

## Custom slide content

Use `ng-template[ngxImageGalleryItemContent]` inside an item to render an Angular component instead of an image. Import `NgxImageGalleryItemContentDirective` into the consuming standalone component.

```ts
readonly insightItem: NgxImageGalleryItem = {
  id: 'exposure-insight',
  alt: 'Exposure analysis',
  data: {
    title: 'Exposure analysis',
    score: 82,
  },
};
```

```html
<div ngxImageGallery>
  <button type="button" [ngxImageGalleryItem]="insightItem">
    Open insight

    <ng-template ngxImageGalleryItemContent let-item let-gallery="gallery">
      <app-insight-panel [insight]="item.data" (closed)="gallery.close()" />
    </ng-template>
  </button>
</div>
```

The item template context provides `$implicit`/`item`, `index`, `count`, `active`, and `gallery`. Custom slides retain modal behavior, focus trapping, navigation, and cleanup, but image loading, image error state, and zoom are skipped.

The lightbox renders the previous, current, and next slides. With two items and `loop: true`, the same custom template can be instantiated more than once. Avoid globally unique DOM IDs and side effects that assume a single template instance.

## Angular Router integration

Router features live in `@design4pro/ngx-image-gallery/router`, keeping the primary entrypoint independent of Angular Router.

```ts
import {
  NgxImageGalleryDirective,
  NgxImageGalleryItemDirective,
} from '@design4pro/ngx-image-gallery';
import {
  NgxImageGalleryCloseOnNavigationDirective,
  NgxImageGalleryUrlStateDirective,
} from '@design4pro/ngx-image-gallery/router';

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryCloseOnNavigationDirective,
    NgxImageGalleryUrlStateDirective,
  ],
  // ...
})
export class ProductGalleryComponent {}
```

### Shareable lightbox URLs

Add `ngxImageGalleryUrlState` with a unique gallery ID. Every item in a URL-synchronized gallery must also have a stable, non-empty `id`.

```angular
<div
  ngxImageGallery
  ngxImageGalleryUrlState="product-gallery"
  [ngxImageGalleryCloseOnNavigation]="{
    closeOnNavigation: false,
    closeOnHistoryBack: true,
  }"
>
  @for (photo of photos; track photo.id) {
    <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
      <img [src]="photo.thumbSrc" [alt]="photo.alt" />
    </a>
  }
</div>
```

The directive uses two query parameters:

- `ngxGallery` identifies the gallery.
- `ngxGalleryItem` identifies the active item.

Opening from user interaction pushes URL state. Moving between items replaces the current state, and closing clears state owned by that gallery. Existing unrelated query parameters are preserved. URL entries with missing or unknown item IDs do not fall back to numeric indexes.

Use a distinct gallery ID for every URL-synchronized gallery on the same route. When URL state and close-on-navigation are combined, keep `closeOnNavigation: false` so the directive's own query-param updates do not close the lightbox; `closeOnHistoryBack: true` still closes it during browser history navigation.

### Close on route changes

For a gallery without URL synchronization, a bare directive closes its lightbox on every Angular Router navigation, including browser history navigation:

```html
<div ngxImageGallery ngxImageGalleryCloseOnNavigation>
  <!-- gallery items -->
</div>
```

The input accepts `boolean | '' | NgxImageGalleryCloseOnNavigationOptions`. Both `closeOnNavigation` and `closeOnHistoryBack` default to `true`.

## Accessibility and interaction

The generated lightbox:

- Uses modal dialog semantics and moves focus into the lightbox.
- Traps focus while open and restores focus to the opener when possible.
- Makes existing page siblings inert and hidden from assistive technology while open.
- Hides inactive slides from assistive technology.
- Locks page scrolling and announces loading or error states.
- Honors `prefers-reduced-motion` by removing gallery transitions.

Default keyboard controls:

| Key                                                | Action                     |
| -------------------------------------------------- | -------------------------- |
| <kbd>Escape</kbd>                                  | Close                      |
| <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>       | Previous / next            |
| <kbd>+</kbd> or <kbd>=</kbd>                       | Zoom in                    |
| <kbd>-</kbd>                                       | Zoom out                   |
| <kbd>0</kbd>                                       | Reset zoom                 |
| <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> | Move within the focus trap |

Generated UI uses English labels by default. Override only what your application needs:

```ts
import type { NgxImageGalleryItem, NgxImageGalleryOptionsInput } from '@design4pro/ngx-image-gallery';

readonly galleryOptions: NgxImageGalleryOptionsInput = {
  labels: {
    dialog: 'Product image gallery',
    closeButton: 'Close product gallery',
    counter: (current: number, total: number) => `Image ${current} of ${total}`,
    thumbnailButton: (item: NgxImageGalleryItem, index: number, total: number) =>
      item.alt
        ? `Show image ${index + 1} of ${total}: ${item.alt}`
        : `Show image ${index + 1} of ${total}`,
  },
};
```

Labels are assigned through `textContent` or ARIA attributes and are never inserted as HTML. When changing colors, verify rendered contrast in a browser; automated DOM accessibility checks cannot measure final visual contrast.

## Image URL safety

`fullSrc`, `thumbSrc`, and `srcset` are application-owned data. Do not pass unsanitized user input into gallery items.

Generated images accept relative URLs, HTTP(S) URLs, blob URLs, and common raster `data:image` URLs for individual image sources. Unsafe schemes are ignored. `srcset` accepts relative, HTTP(S), or blob candidates; if any candidate is unsafe, the entire `srcset` value is dropped.

Avoid embedding sensitive tokens in third-party image URLs because the browser requests accepted remote images directly.

## Support

- Browse the [documentation and live examples](https://design4pro.github.io/ngx-image-gallery/).
- Check [existing issues](https://github.com/design4pro/ngx-image-gallery/issues) before reporting a problem.
- Include a minimal reproduction, Angular version, browser, and expected behavior in new bug reports.

## Attribution

This package adapts selected PhotoSwipe v5 interaction and layout ideas for Angular. PhotoSwipe is MIT licensed. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

MIT. See [LICENSE](LICENSE).
