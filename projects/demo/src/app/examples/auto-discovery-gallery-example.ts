import { Component } from '@angular/core';
import {
  NgxImageGalleryAutoDirective,
  NgxImageGalleryDirective,
  type NgxImageGalleryOpenOptions,
} from '@design4pro/ngx-image-gallery';

@Component({
  selector: 'app-auto-discovery-gallery-example',
  imports: [NgxImageGalleryDirective, NgxImageGalleryAutoDirective],
  template: `
    <article
      ngxImageGallery
      ngxImageGalleryAuto
      [ngxImageGallery]="options"
      class="auto-gallery-article"
      aria-label="Auto-discovered gallery demo"
    >
      <p>
        Static article and CMS markup can opt in to the lightbox without adding
        <code>ngxImageGalleryItem</code>
        to every image.
      </p>

      <a class="auto-gallery-feature" href="https://picsum.photos/id/1011/1600/1000">
        <img
          src="https://picsum.photos/id/1011/900/600"
          srcset="
            https://picsum.photos/id/1011/900/600    900w,
            https://picsum.photos/id/1011/1600/1000 1600w
          "
          sizes="(min-width: 900px) 720px, 100vw"
          alt="Kayaker crossing a calm alpine lake"
          width="1600"
          height="1000"
        />
      </a>

      <div class="auto-gallery-grid">
        <a href="https://picsum.photos/id/1018/1400/1000">
          <img
            src="https://picsum.photos/id/1018/700/500"
            alt="Forest stream running over dark rocks"
          />
        </a>

        <img src="https://picsum.photos/id/1036/900/700" alt="Rocky coastline under a cloudy sky" />
      </div>
    </article>
  `,
  styles: `
    .auto-gallery-article {
      display: grid;
      gap: 16px;
      color: #18181b;
    }

    .auto-gallery-article p {
      max-width: 64ch;
      margin: 0;
      color: #52525b;
      line-height: 1.7;
    }

    .auto-gallery-article code {
      border-radius: 4px;
      background: #f4f4f5;
      padding: 2px 5px;
      font-size: 0.9em;
    }

    .auto-gallery-feature,
    .auto-gallery-grid a,
    .auto-gallery-grid img {
      overflow: hidden;
      border: 1px solid color-mix(in srgb, #18181b 10%, transparent);
      border-radius: 8px;
      background: #e4e4e7;
      outline-offset: 3px;
    }

    .auto-gallery-feature {
      display: block;
      aspect-ratio: 16 / 9;
    }

    .auto-gallery-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .auto-gallery-grid a,
    .auto-gallery-grid img {
      display: block;
      aspect-ratio: 4 / 3;
    }

    .auto-gallery-feature img,
    .auto-gallery-grid img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 180ms ease;
    }

    .auto-gallery-feature:hover img,
    .auto-gallery-grid a:hover img,
    .auto-gallery-grid img:hover {
      transform: scale(1.03);
    }

    .auto-gallery-feature:focus-visible,
    .auto-gallery-grid a:focus-visible,
    .auto-gallery-grid img:focus-visible {
      outline: 3px solid #2563eb;
    }
  `,
})
export class AutoDiscoveryGalleryExample {
  protected readonly options: Partial<NgxImageGalleryOpenOptions> = {
    showThumbnails: true,
  };
}
