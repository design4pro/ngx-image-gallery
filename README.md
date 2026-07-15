# @design4pro/ngx-image-gallery

[![Angular 20–22](https://img.shields.io/badge/Angular-20--22-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Deploy GitHub Pages](https://github.com/design4pro/ngx-image-gallery/actions/workflows/pages.yml/badge.svg)](https://github.com/design4pro/ngx-image-gallery/actions/workflows/pages.yml)
[![GitHub release](https://img.shields.io/github/v/release/design4pro/ngx-image-gallery)](https://github.com/design4pro/ngx-image-gallery/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](projects/ngx-image-gallery/LICENSE)

A native Angular image gallery with a responsive lightbox, progressive image loading, touch gestures, zoom, and accessible defaults.

[Live demo](https://design4pro.github.io/ngx-image-gallery/) ·
[Documentation](https://design4pro.github.io/ngx-image-gallery/docs/installation) ·
[Examples](https://design4pro.github.io/ngx-image-gallery/examples/custom-properties) ·
[Releases](https://github.com/design4pro/ngx-image-gallery/releases)

## Why ngx-image-gallery?

- Standalone Angular directives with a small, typed API.
- Smooth lightbox opening from the selected thumbnail.
- Progressive loading with thumbnail-first rendering.
- Swipe navigation, pinch and wheel zoom, double-click zoom, and bounded panning.
- Accessible modal behavior, keyboard navigation, focus trapping, focus restoration, and reduced-motion support.
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

The anchor keeps a useful native fallback and supports modified clicks such as <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + click. No gallery stylesheet import is required; the library supplies minimal default lightbox styles when the first gallery opens.

## Customize without framework lock-in

The default lightbox is deliberately minimal. Applications own thumbnail layout and can customize generated lightbox elements with CSS custom properties, additive classes, or a custom Angular template.

```ts
readonly galleryOptions: NgxImageGalleryOptionsInput = {
  classes: {
    overlay: 'brand-lightbox',
  },
};
```

```css
.brand-lightbox {
  --ngx-image-gallery-backdrop-background: rgb(5 10 20 / 92%);
  --ngx-image-gallery-control-background: rgb(255 255 255 / 16%);
  --ngx-image-gallery-control-border-radius: 999px;
  --ngx-image-gallery-control-focus-outline: 2px solid #38bdf8;
  --ngx-image-gallery-thumbnail-active-border-color: #38bdf8;
}
```

Tailwind and other utility frameworks can be used by consuming applications, but they are not required by the library.

## Accessibility and interaction

The generated lightbox provides modal dialog semantics, focus management, inactive-slide hiding, scroll locking, loading and error announcements, and reduced-motion support.

Default keyboard controls:

| Key                                                | Action                     |
| -------------------------------------------------- | -------------------------- |
| <kbd>Escape</kbd>                                  | Close                      |
| <kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd>       | Previous / next            |
| <kbd>+</kbd> or <kbd>=</kbd>                       | Zoom in                    |
| <kbd>-</kbd>                                       | Zoom out                   |
| <kbd>0</kbd>                                       | Reset zoom                 |
| <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> | Move within the focus trap |

Generated UI uses English labels by default. Applications can localize dialog, control, counter, thumbnail, loading, error, and item labels through typed gallery options.

## Angular Router integration

Router behavior lives in the optional `@design4pro/ngx-image-gallery/router` secondary entrypoint, keeping the primary entrypoint independent of Angular Router.

```ts
import { NgxImageGalleryCloseOnNavigationDirective } from '@design4pro/ngx-image-gallery/router';
```

```html
<div ngxImageGallery ngxImageGalleryCloseOnNavigation>
  <!-- gallery items -->
</div>
```

The directive closes the gallery-owned lightbox when Angular Router navigation starts, including browser history navigation.

## Documentation

| Topic              | Guide                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Installation       | [Install and provide defaults](https://design4pro.github.io/ngx-image-gallery/docs/installation)             |
| Usage              | [Directive markup and item data](https://design4pro.github.io/ngx-image-gallery/docs/usage)                  |
| API options        | [Gallery, item, and router options](https://design4pro.github.io/ngx-image-gallery/docs/options)             |
| Styling            | [Custom properties and class hooks](https://design4pro.github.io/ngx-image-gallery/docs/styling)             |
| Custom UI          | [Custom controls and slide content](https://design4pro.github.io/ngx-image-gallery/docs/custom-lightbox)     |
| Accessibility      | [Semantics, keyboard support, and labels](https://design4pro.github.io/ngx-image-gallery/docs/accessibility) |
| Router integration | [Close on route changes](https://design4pro.github.io/ngx-image-gallery/docs/router-close)                   |

Explore working examples for [CSS custom properties](https://design4pro.github.io/ngx-image-gallery/examples/custom-properties), [Tailwind 4](https://design4pro.github.io/ngx-image-gallery/examples/tailwind), [custom Angular content](https://design4pro.github.io/ngx-image-gallery/examples/custom-content), [auto-discovery](https://design4pro.github.io/ngx-image-gallery/examples/auto-discovery), and [router integration](https://design4pro.github.io/ngx-image-gallery/examples/router-close).

The [package README](projects/ngx-image-gallery/README.md) contains the complete consumer reference, including configuration, auto-discovery boundaries, custom templates, image URL safety, and all styling hooks.

## Repository structure

| Path                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `projects/ngx-image-gallery`    | Angular library and package documentation.               |
| `projects/demo`                 | Documentation site and live gallery examples.            |
| `DESIGN.md`                     | Architecture, API, styling, and accessibility decisions. |
| `.github/workflows/pages.yml`   | GitHub Pages build and deployment.                       |
| `.github/workflows/release.yml` | Package release workflow.                                |

Read [DESIGN.md](DESIGN.md) before changing library architecture or public APIs. The library intentionally remains directive-based, UI-framework independent, and consumer-styled.

## Local development

Install dependencies, build the library, and start the documentation site:

```bash
npm ci
npx ng build ngx-image-gallery
npx ng serve demo
```

Open `http://localhost:4200/`.

The demo imports `ngx-image-gallery` from `dist/ngx-image-gallery`, so rebuild the library before testing demo changes that depend on library code.

## Verification

Run the repository checks in this order:

```bash
npx prettier --check .
npx ng test ngx-image-gallery --watch=false
npx ng build ngx-image-gallery
npx ng test demo --watch=false
npx ng build demo --configuration development
```

For the GitHub Pages artifact:

```bash
npx ng build demo --configuration production --base-href /ngx-image-gallery/
cp dist/demo/browser/index.html dist/demo/browser/404.html
```

## Package artifact

Build the Angular Package Format output before packing or publishing:

```bash
npx ng build ngx-image-gallery
npm pack ./dist/ngx-image-gallery --dry-run
```

Do not pack `projects/ngx-image-gallery` directly; it is the source package, not the built artifact.

## Support

- Browse the [documentation and live examples](https://design4pro.github.io/ngx-image-gallery/).
- Check [existing issues](https://github.com/design4pro/ngx-image-gallery/issues) before reporting a problem.
- Include a minimal reproduction, Angular version, browser, and expected behavior in new bug reports.

## Attribution

This package adapts selected PhotoSwipe v5 interaction and layout ideas for Angular. PhotoSwipe is MIT licensed. See [THIRD_PARTY_NOTICES.md](projects/ngx-image-gallery/THIRD_PARTY_NOTICES.md).

## License

MIT. See [LICENSE](projects/ngx-image-gallery/LICENSE).
