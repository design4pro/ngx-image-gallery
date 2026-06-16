# ngx-image-gallery workspace

This workspace contains the `ngx-image-gallery` Angular library and a demo application.

## Projects

- `projects/ngx-image-gallery`: directive-only Angular image gallery library.
- `projects/demo`: consumer demo with CSS custom properties and Tailwind 4 examples.

## Development Server

```bash
npx ng serve demo
```

Open `http://localhost:4200/`.

## Build

Build the library:

```bash
npx ng build ngx-image-gallery
```

Build the demo:

```bash
npx ng build demo --configuration development
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
