# ngx-image-gallery Design

## Goals

`ngx-image-gallery` is a native Angular image gallery with a PhotoSwipe-like lightbox experience and no runtime dependency on PhotoSwipe or a third-party UI framework.

The library should:

- Use standalone directives for consumer markup.
- Load full-size images only after the lightbox opening animation finishes.
- Work without required original image dimensions.
- Support keyboard navigation, focus restoration, backdrop/escape close, swipe, pinch, pan, and double-click zoom.
- Let applications own visual design through CSS custom properties, configured classes, and custom lightbox templates.

## Non-Goals

- Do not ship a design system.
- Do not depend on Tailwind, Angular Material, CDK overlay, Bootstrap, or another third-party UI framework.
- Do not expose a component-first API for gallery markup.
- Do not require consumers to provide image dimensions.

## Public Shape

The core public API is:

- `NgxImageGalleryDirective` on a gallery container.
- `NgxImageGalleryItemDirective` on clickable gallery items.
- `NgxImageGalleryLightboxDirective` on an optional `ng-template`.
- `NgxImageGalleryService` for imperative open/close/navigation.
- `provideNgxImageGallery()` for application defaults.

Typical markup:

```html
<div ngxImageGallery>
  <a [href]="photo.fullSrc" [ngxImageGalleryItem]="photo">
    <img [src]="photo.thumbSrc" [alt]="photo.alt" />
  </a>
</div>
```

## Lightbox Structure

The service creates the dialog DOM at runtime and appends it to `document.body`. The generated structure is intentionally small:

- `.ngx-image-gallery-overlay`
- `.ngx-image-gallery-backdrop`
- `.ngx-image-gallery-stage`
- `.ngx-image-gallery-track`
- `.ngx-image-gallery-slide`
- `.ngx-image-gallery-media`
- `.ngx-image-gallery-image`
- `.ngx-image-gallery-ui`
- `.ngx-image-gallery-default-ui`
- `.ngx-image-gallery-custom-ui`

The service owns this structure because it is tied to geometry, animation, gestures, focus management, and progressive loading.

## Styling Model

Default styles are structural and tokenized with CSS custom properties. Applications can override the default lightbox without replacing the runtime behavior:

```css
.brand-lightbox {
  --ngx-image-gallery-backdrop-background: rgb(5 10 20 / 92%);
  --ngx-image-gallery-control-background: rgb(255 255 255 / 16%);
  --ngx-image-gallery-control-border-radius: 999px;
}
```

Applications can attach the class through options:

```ts
const galleryOptions = {
  classes: {
    overlay: 'brand-lightbox',
  },
};
```

The `classes` option adds classes to generated elements and never removes the structural `ngx-image-gallery-*` hooks.

## Tailwind

Tailwind is not part of the library package. The demo uses Tailwind 4 as a consumer-side example with:

- `tailwindcss`, `@tailwindcss/postcss`, and `postcss` as workspace dev dependencies.
- `.postcssrc.json` with the `@tailwindcss/postcss` plugin.
- `@use 'tailwindcss';` in the demo global stylesheet.

Consumers can use Tailwind utilities in their thumbnail markup and in a custom lightbox template.

## Custom Lightbox UI

Applications can replace the default lightbox chrome with:

```html
<div ngxImageGallery>
  <ng-template ngxImageGalleryLightbox let-gallery>
    <button type="button" (click)="gallery.previous()" [disabled]="!gallery.canGoPrevious">
      Previous
    </button>
    <span>{{ gallery.activeIndex + 1 }} / {{ gallery.count }}</span>
    <button type="button" (click)="gallery.next()" [disabled]="!gallery.canGoNext">Next</button>
    <button type="button" (click)="gallery.close()">Close</button>
  </ng-template>
</div>
```

The template context exposes state and commands. `let-gallery` maps to the full context:

- `state`, `$implicit`
- `items`, `activeItem`, `activeIndex`, `count`
- `isOpen`, `canGoPrevious`, `canGoNext`, `isLoading`, `hasError`
- `close()`, `previous()`, `next()`, `goTo(index)`

Consumers can render a component inside the template:

```html
<ng-template ngxImageGalleryLightbox let-gallery>
  <app-gallery-lightbox-controls [gallery]="gallery" />
</ng-template>
```

This keeps the library directive-based while still allowing component-owned custom UI.

## Accessibility

The generated overlay uses `role="dialog"` and `aria-modal="true"`. The service moves focus inside the dialog, traps focus inside default or custom controls, marks existing body siblings as inert and `aria-hidden`, locks body scrolling, restores focus to the opener when it is still connected, supports escape close, and keeps keyboard navigation on arrow keys.

Inactive slides are hidden from assistive technology. The active slide receives a slide role description and a label derived from the counter and item `alt` text. Loading and error states are announced only while active.

Generated UI labels are configurable through the `labels` option. Label values are assigned as text content or ARIA attributes, never as HTML.

Custom templates should keep interactive elements as native `button`, `a`, `input`, `select`, or `textarea` elements when possible. When custom templates replace default controls, the app owns names for icon-only controls, live regions for changing counters, and meaningful thumbnail button labels.

## Image Source Boundary

Gallery item URLs are application-owned data. The library only assigns relative URLs, HTTP(S) URLs, blob URLs, and common raster `data:image` URLs to generated single-source images. Unsafe schemes are ignored. `srcset` values should use relative, HTTP(S), or blob candidates; a list with an unsafe candidate is dropped.

Do not pass unsanitized user input into `fullSrc`, `thumbSrc`, or `srcset`. Avoid putting sensitive tokens in remote image URLs because accepted remote images are requested directly by the browser.

## Verification

Library changes should normally pass:

```bash
npx prettier --check .
npx ng test ngx-image-gallery --watch=false
npx ng build ngx-image-gallery
npx ng test demo --watch=false
npx ng build demo --configuration development
```
