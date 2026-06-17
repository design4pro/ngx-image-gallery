# ngx-image-gallery workspace

This workspace contains the `ngx-image-gallery` Angular library and a demo application.

## Projects

- `projects/ngx-image-gallery`: directive-only Angular image gallery library.
- `projects/demo`: GitHub Pages docsite with Spartan UI, Tailwind 4, docs, and gallery examples.

## Development Server

```bash
npx ng serve demo
```

Open `http://localhost:4200/`.

Main routes:

- `/`: landing page with a live gallery preview.
- `/examples/custom-properties`: pure CSS and custom properties gallery demo.
- `/examples/tailwind`: Tailwind 4 gallery demo.
- `/examples/route-sync`: URL-controlled lightbox demo.
- `/docs/installation`, `/docs/usage`, `/docs/options`, `/docs/styling`, `/docs/custom-lightbox`, `/docs/route-sync`: documentation routes.

## Build

Build the library:

```bash
npx ng build ngx-image-gallery
```

Build the demo:

```bash
npx ng build demo --configuration development
```

Build the GitHub Pages artifact:

```bash
npx ng build demo --configuration production --base-href /ngx-image-gallery/
cp dist/demo/browser/index.html dist/demo/browser/404.html
```

## Tests

Run library tests:

```bash
npx ng test ngx-image-gallery --watch=false
```

Run demo tests:

```bash
npx ng test demo --watch=false
```

## Formatting

```bash
npx prettier --check .
```

## Design Notes

Read `DESIGN.md` before changing library architecture or public API. The library intentionally stays independent of UI frameworks. Tailwind is used only by the demo as a consumer styling example.
