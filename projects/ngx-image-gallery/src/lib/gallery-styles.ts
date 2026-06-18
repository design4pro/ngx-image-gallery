export const GALLERY_STYLE_ID = 'ngx-image-gallery-styles';

export const GALLERY_STYLES = `
:where(.ngx-image-gallery-overlay) {
  --ngx-image-gallery-z-index: 1000;
  --ngx-image-gallery-color: #fff;
  --ngx-image-gallery-font-family: Arial, Helvetica, sans-serif;
  --ngx-image-gallery-backdrop-background: rgba(0, 0, 0, 0.88);
  --ngx-image-gallery-backdrop-transition: opacity 220ms ease;
  --ngx-image-gallery-media-transition: transform 333ms cubic-bezier(.4, 0, .22, 1), width 333ms cubic-bezier(.4, 0, .22, 1), height 333ms cubic-bezier(.4, 0, .22, 1);
  --ngx-image-gallery-full-image-transition: opacity 180ms ease;
  --ngx-image-gallery-ui-transition: opacity 160ms ease;
  --ngx-image-gallery-control-color: #fff;
  --ngx-image-gallery-control-background: rgba(20, 20, 20, 0.72);
  --ngx-image-gallery-control-border-radius: 4px;
  --ngx-image-gallery-control-size: 44px;
  --ngx-image-gallery-control-offset: 16px;
  --ngx-image-gallery-control-focus-outline: 3px solid #fff;
  --ngx-image-gallery-counter-padding: 0 12px;
  --ngx-image-gallery-counter-font-size: 14px;
  --ngx-image-gallery-thumbnails-gap: 8px;
  --ngx-image-gallery-thumbnails-padding: 0 16px 16px;
  --ngx-image-gallery-thumbnail-size: 64px;
  --ngx-image-gallery-thumbnail-border: 2px solid transparent;
  --ngx-image-gallery-thumbnail-active-border-color: #fff;
  --ngx-image-gallery-thumbnail-border-radius: 4px;
  --ngx-image-gallery-thumbnail-background: rgba(255, 255, 255, 0.08);
  --ngx-image-gallery-thumbnail-opacity: 0.68;
  --ngx-image-gallery-thumbnail-active-opacity: 1;
  --ngx-image-gallery-status-background: rgba(20, 20, 20, 0.56);
  --ngx-image-gallery-status-border-radius: 4px;
  --ngx-image-gallery-status-padding: 8px 12px;
  --ngx-image-gallery-status-font-size: 13px;
}
.ngx-image-gallery-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--ngx-image-gallery-z-index);
  color: var(--ngx-image-gallery-color);
  font-family: var(--ngx-image-gallery-font-family);
  outline: none;
  touch-action: none;
  overscroll-behavior: contain;
}
.ngx-image-gallery-overlay,
.ngx-image-gallery-overlay * {
  box-sizing: border-box;
}
.ngx-image-gallery-backdrop {
  position: absolute;
  inset: 0;
  background: var(--ngx-image-gallery-backdrop-background);
  opacity: 0;
  transition: var(--ngx-image-gallery-backdrop-transition);
}
.ngx-image-gallery-overlay.ngx-image-gallery-open .ngx-image-gallery-backdrop {
  opacity: 1;
}
.ngx-image-gallery-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  outline: none;
  touch-action: none;
}
.ngx-image-gallery-track {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.ngx-image-gallery-slide {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
}
.ngx-image-gallery-slide-prev {
  transform: translate3d(-100%, 0, 0);
}
.ngx-image-gallery-slide-current {
  transform: translate3d(0, 0, 0);
}
.ngx-image-gallery-slide-next {
  transform: translate3d(100%, 0, 0);
}
.ngx-image-gallery-media {
  position: absolute;
  transform-origin: 0 0;
  will-change: transform, width, height;
  touch-action: none;
  transition: var(--ngx-image-gallery-media-transition);
  user-select: none;
}
.ngx-image-gallery-image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  touch-action: none;
}
.ngx-image-gallery-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: auto;
}
.ngx-image-gallery-thumb {
  filter: blur(0);
}
.ngx-image-gallery-media.ngx-image-gallery-origin-crop .ngx-image-gallery-image {
  object-fit: cover;
}
.ngx-image-gallery-full {
  opacity: 0;
  transition: var(--ngx-image-gallery-full-image-transition);
}
.ngx-image-gallery-full.ngx-image-gallery-loaded {
  opacity: 1;
}
.ngx-image-gallery-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: var(--ngx-image-gallery-ui-transition);
}
.ngx-image-gallery-overlay.ngx-image-gallery-open .ngx-image-gallery-ui {
  opacity: 1;
}
.ngx-image-gallery-default-ui,
.ngx-image-gallery-custom-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ngx-image-gallery-custom-ui :is(a[href], button, input, select, textarea, [tabindex]) {
  pointer-events: auto;
}
.ngx-image-gallery-button,
.ngx-image-gallery-counter {
  pointer-events: auto;
  position: absolute;
  min-width: var(--ngx-image-gallery-control-size);
  min-height: var(--ngx-image-gallery-control-size);
  border: 0;
  border-radius: var(--ngx-image-gallery-control-border-radius);
  color: var(--ngx-image-gallery-control-color);
  background: var(--ngx-image-gallery-control-background);
  font: inherit;
  line-height: 1;
}
.ngx-image-gallery-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ngx-image-gallery-control-size);
  height: var(--ngx-image-gallery-control-size);
  padding: 0;
  cursor: pointer;
}
.ngx-image-gallery-button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  line-height: 1;
}
.ngx-image-gallery-button:focus-visible {
  outline: var(--ngx-image-gallery-control-focus-outline);
  outline-offset: 2px;
  box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.72);
}
.ngx-image-gallery-close {
  top: var(--ngx-image-gallery-control-offset);
  right: var(--ngx-image-gallery-control-offset);
  font-size: 28px;
}
.ngx-image-gallery-prev,
.ngx-image-gallery-next {
  top: 50%;
  transform: translateY(-50%);
  font-size: 34px;
}
.ngx-image-gallery-prev {
  left: var(--ngx-image-gallery-control-offset);
}
.ngx-image-gallery-next {
  right: var(--ngx-image-gallery-control-offset);
}
.ngx-image-gallery-counter {
  top: var(--ngx-image-gallery-control-offset);
  left: var(--ngx-image-gallery-control-offset);
  display: flex;
  align-items: center;
  padding: var(--ngx-image-gallery-counter-padding);
  font-size: var(--ngx-image-gallery-counter-font-size);
}
.ngx-image-gallery-thumbnails {
  pointer-events: auto;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: var(--ngx-image-gallery-thumbnails-gap);
  align-items: center;
  justify-content: center;
  overflow-x: auto;
  padding: var(--ngx-image-gallery-thumbnails-padding);
  scrollbar-width: thin;
}
.ngx-image-gallery-thumbnail {
  display: block;
  flex: 0 0 auto;
  width: var(--ngx-image-gallery-thumbnail-size);
  height: var(--ngx-image-gallery-thumbnail-size);
  overflow: hidden;
  border: var(--ngx-image-gallery-thumbnail-border);
  border-radius: var(--ngx-image-gallery-thumbnail-border-radius);
  padding: 0;
  background: var(--ngx-image-gallery-thumbnail-background);
  opacity: var(--ngx-image-gallery-thumbnail-opacity);
  cursor: pointer;
}
.ngx-image-gallery-thumbnail-active {
  border-color: var(--ngx-image-gallery-thumbnail-active-border-color);
  opacity: var(--ngx-image-gallery-thumbnail-active-opacity);
}
.ngx-image-gallery-thumbnail:focus-visible {
  outline: var(--ngx-image-gallery-control-focus-outline);
  outline-offset: 2px;
  box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.72);
}
.ngx-image-gallery-thumbnail-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ngx-image-gallery-loading,
.ngx-image-gallery-error {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  min-height: 32px;
  border-radius: var(--ngx-image-gallery-status-border-radius);
  padding: var(--ngx-image-gallery-status-padding);
  background: var(--ngx-image-gallery-status-background);
  font-size: var(--ngx-image-gallery-status-font-size);
  opacity: 0;
  transition: var(--ngx-image-gallery-ui-transition);
  pointer-events: none;
}
.ngx-image-gallery-has-thumbnails .ngx-image-gallery-loading,
.ngx-image-gallery-has-thumbnails .ngx-image-gallery-error {
  bottom: calc(var(--ngx-image-gallery-thumbnail-size) + 40px);
}
.ngx-image-gallery-loading.ngx-image-gallery-visible,
.ngx-image-gallery-error.ngx-image-gallery-visible {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .ngx-image-gallery-backdrop,
  .ngx-image-gallery-media,
  .ngx-image-gallery-full,
  .ngx-image-gallery-ui,
  .ngx-image-gallery-thumbnail,
  .ngx-image-gallery-loading,
  .ngx-image-gallery-error {
    transition: none;
  }
}
`;
