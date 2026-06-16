# Repository Instructions

This repository contains `ngx-image-gallery`, a native Angular image gallery library and a demo application.

## Working Principles

- Understand the current library and demo behavior before editing.
- Keep changes surgical. Do not refactor adjacent code unless the requested behavior requires it.
- Prefer directive-based APIs over components. The public library should stay UI-framework independent.
- Write code, comments, and documentation in English.
- Respond to the user in the language of the conversation.
- Do not add runtime or peer dependencies for UI frameworks.
- Tailwind is allowed only in the demo workspace as a styling example, not as a library dependency.

## Architecture Boundaries

- Library source lives in `projects/ngx-image-gallery/src/lib`.
- Demo source lives in `projects/demo/src`.
- The package name is `ngx-image-gallery`.
- The lightbox service owns the structural DOM needed for dialog behavior, image layout, gestures, focus, and progressive loading.
- Consumers own visual styling through CSS custom properties, stable `ngx-image-gallery-*` class hooks, optional configured classes, or `ng-template[ngxImageGalleryLightbox]`.
- Keep default styles minimal and tokenized through CSS custom properties.
- Do not make the library depend on PhotoSwipe, Tailwind, Angular Material, CDK overlay, Bootstrap, or another UI framework.

## Public API Guidelines

- Export standalone directives and typed provider/configuration APIs from `projects/ngx-image-gallery/src/public-api.ts`.
- Add options only when they are needed by a real consumer workflow.
- Preserve existing selector names and class hooks unless a breaking change is explicitly requested.
- For custom lightbox UI, prefer `ng-template[ngxImageGalleryLightbox]`; consumers can render their own component inside the template.
- Keep template context objects small, explicit, and documented.

## Styling Guidelines

- Default lightbox styles must be overrideable with CSS custom properties.
- Keep generated DOM class names stable and documented.
- Optional `classes` configuration should add classes to generated elements without removing the structural `ngx-image-gallery-*` classes.
- Tailwind examples should use regular utility classes in the demo templates. Do not require Tailwind for the library package.

## Verification

Use the narrowest useful checks for the change. For normal library changes, run:

```bash
npx prettier --check .
npx ng test ngx-image-gallery --watch=false
npx ng build ngx-image-gallery
npx ng test demo --watch=false
npx ng build demo --configuration development
```

Build the library before verifying the demo when the demo imports from `dist/ngx-image-gallery`.

## Git Hygiene

- Preserve user changes and existing local commits.
- Do not rewrite branch history unless explicitly asked.
- Do not commit, push, or open pull requests unless the user asks for that workflow.
