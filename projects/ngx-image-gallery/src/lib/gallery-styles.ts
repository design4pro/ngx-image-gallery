export const GALLERY_STYLE_ID = 'ngx-image-gallery-styles';

export const GALLERY_STYLES = `
.ngx-image-gallery-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  color: #fff;
  font-family: Arial, Helvetica, sans-serif;
  outline: none;
  touch-action: none;
}
.ngx-image-gallery-overlay,
.ngx-image-gallery-overlay * {
  box-sizing: border-box;
}
.ngx-image-gallery-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  opacity: 0;
  transition: opacity 220ms ease;
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
  will-change: transform;
  transition: transform 333ms cubic-bezier(.4, 0, .22, 1);
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
}
.ngx-image-gallery-thumb {
  filter: blur(0);
}
.ngx-image-gallery-full {
  opacity: 0;
  transition: opacity 180ms ease;
}
.ngx-image-gallery-full.ngx-image-gallery-loaded {
  opacity: 1;
}
.ngx-image-gallery-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 160ms ease;
}
.ngx-image-gallery-overlay.ngx-image-gallery-open .ngx-image-gallery-ui {
  opacity: 1;
}
.ngx-image-gallery-button,
.ngx-image-gallery-counter {
  pointer-events: auto;
  position: absolute;
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  background: rgba(20, 20, 20, 0.48);
  font: inherit;
  line-height: 1;
}
.ngx-image-gallery-button {
  display: grid;
  place-items: center;
  cursor: pointer;
}
.ngx-image-gallery-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
.ngx-image-gallery-close {
  top: 16px;
  right: 16px;
  font-size: 28px;
}
.ngx-image-gallery-prev,
.ngx-image-gallery-next {
  top: 50%;
  transform: translateY(-50%);
  font-size: 34px;
}
.ngx-image-gallery-prev {
  left: 16px;
}
.ngx-image-gallery-next {
  right: 16px;
}
.ngx-image-gallery-counter {
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 14px;
}
.ngx-image-gallery-loading,
.ngx-image-gallery-error {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  min-height: 32px;
  border-radius: 4px;
  padding: 8px 12px;
  background: rgba(20, 20, 20, 0.56);
  font-size: 13px;
  opacity: 0;
  transition: opacity 160ms ease;
  pointer-events: none;
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
  .ngx-image-gallery-loading,
  .ngx-image-gallery-error {
    transition: none;
  }
}
`;
