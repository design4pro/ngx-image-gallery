import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import { NgxImageGalleryItemContentDirective } from './ngx-image-gallery-item-content.directive';
import { NgxImageGalleryLightboxDirective } from './ngx-image-gallery-lightbox.directive';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import type { NgxImageGalleryItem } from './gallery-types';

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryLightboxDirective,
  ],
  template: `
    <div ngxImageGallery>
      <ng-template ngxImageGalleryLightbox let-gallery>
        <div id="custom-status">{{ gallery.activeIndex + 1 }} / {{ gallery.count }}</div>
        <button id="custom-close" type="button" (click)="gallery.close()">Close</button>
      </ng-template>

      <a id="first" href="full-1.jpg" [ngxImageGalleryItem]="items[0]">
        <img src="thumb-1.jpg" alt="First" />
      </a>
      <a id="second" href="full-2.jpg" [ngxImageGalleryItem]="items[1]">
        <img src="thumb-2.jpg" alt="Second" />
      </a>
    </div>
  `,
})
class HostComponent {
  readonly items: NgxImageGalleryItem[] = [
    { fullSrc: 'full-1.jpg', thumbSrc: 'thumb-1.jpg', alt: 'First' },
    { fullSrc: 'full-2.jpg', thumbSrc: 'thumb-2.jpg', alt: 'Second' },
  ];
}

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryItemContentDirective,
  ],
  template: `
    <div ngxImageGallery>
      <button id="custom-item" type="button" [ngxImageGalleryItem]="customItem">
        Open custom item
        <ng-template
          ngxImageGalleryItemContent
          let-item
          let-index="index"
          let-count="count"
          let-active="active"
          let-gallery="gallery"
        >
          <section
            id="custom-item-content"
            [attr.data-kind]="getItemKind(item)"
            [attr.data-index]="index"
            [attr.data-count]="count"
            [attr.data-active]="active"
          >
            <button id="custom-item-close" type="button" (click)="gallery.close()">Close</button>
          </section>
        </ng-template>
      </button>

      <a id="image-item" href="full-2.jpg" [ngxImageGalleryItem]="imageItem">
        <img src="thumb-2.jpg" alt="Second" />
      </a>
    </div>
  `,
})
class ItemContentHostComponent {
  readonly customItem: NgxImageGalleryItem = {
    thumbSrc: 'custom-thumb.jpg',
    alt: 'Custom analytics',
    data: { kind: 'analytics' },
  };
  readonly imageItem: NgxImageGalleryItem = {
    fullSrc: 'full-2.jpg',
    thumbSrc: 'thumb-2.jpg',
    alt: 'Second',
  };

  getItemKind(item: NgxImageGalleryItem): string {
    return (item.data as { kind: string }).kind;
  }
}

describe('ngxImageGallery directives', () => {
  let fixture: ComponentFixture<HostComponent>;
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(async () => {
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();
  });

  afterEach(() => {
    service.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
  });

  it('opens the gallery from the clicked registered item', () => {
    const second = fixture.nativeElement.querySelector('#second') as HTMLAnchorElement;

    second.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
    expect(service.activeIndex()).toBe(1);
    expect(document.querySelector('.ngx-image-gallery-overlay')).toBeTruthy();
  });

  it('renders a custom lightbox template with gallery context', () => {
    const first = fixture.nativeElement.querySelector('#first') as HTMLAnchorElement;

    first.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    fixture.detectChanges();

    const status = document.querySelector('#custom-status');
    const defaultUi = document.querySelector('.ngx-image-gallery-default-ui');

    expect(status?.textContent?.trim()).toBe('1 / 2');
    expect(defaultUi?.hasAttribute('hidden')).toBe(true);
  });

  it('renders per-item custom content with item and gallery context', async () => {
    const customFixture = TestBed.createComponent(ItemContentHostComponent);
    customFixture.detectChanges();
    const item = customFixture.nativeElement.querySelector('#custom-item') as HTMLButtonElement;

    item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    customFixture.detectChanges();

    const content = document.querySelector<HTMLElement>('#custom-item-content');
    const close = document.querySelector<HTMLButtonElement>('#custom-item-close');

    expect(content?.getAttribute('data-kind')).toBe('analytics');
    expect(content?.getAttribute('data-index')).toBe('0');
    expect(content?.getAttribute('data-count')).toBe('2');
    expect(content?.getAttribute('data-active')).toBe('true');

    close?.click();
    await new Promise((resolve) => window.setTimeout(resolve, 350));

    expect(service.isOpen()).toBe(false);
  });
});

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class RoutedHostComponent {}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    <div ngxImageGallery [ngxImageGallery]="{ showThumbnails: true }">
      <a id="route-a-first" href="route-a-full-1.jpg" [ngxImageGalleryItem]="items[0]">
        <img src="route-a-thumb-1.jpg" alt="Route A first" />
      </a>
      <a id="route-a-second" href="route-a-full-2.jpg" [ngxImageGalleryItem]="items[1]">
        <img src="route-a-thumb-2.jpg" alt="Route A second" />
      </a>
    </div>
  `,
})
class RouteGalleryAComponent {
  readonly items: NgxImageGalleryItem[] = [
    { fullSrc: 'route-a-full-1.jpg', thumbSrc: 'route-a-thumb-1.jpg', alt: 'Route A first' },
    { fullSrc: 'route-a-full-2.jpg', thumbSrc: 'route-a-thumb-2.jpg', alt: 'Route A second' },
  ];
}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    <div ngxImageGallery [ngxImageGallery]="{ showThumbnails: true }">
      <a id="route-b-first" href="route-b-full-1.jpg" [ngxImageGalleryItem]="items[0]">
        <img src="route-b-thumb-1.jpg" alt="Route B first" />
      </a>
      <a id="route-b-second" href="route-b-full-2.jpg" [ngxImageGalleryItem]="items[1]">
        <img src="route-b-thumb-2.jpg" alt="Route B second" />
      </a>
    </div>
  `,
})
class RouteGalleryBComponent {
  readonly items: NgxImageGalleryItem[] = [
    { fullSrc: 'route-b-full-1.jpg', thumbSrc: 'route-b-thumb-1.jpg', alt: 'Route B first' },
    { fullSrc: 'route-b-full-2.jpg', thumbSrc: 'route-b-thumb-2.jpg', alt: 'Route B second' },
  ];
}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    <button id="swap-pool" type="button" (click)="showSecondPool()">Swap pool</button>

    <div ngxImageGallery [ngxImageGallery]="{ showThumbnails: true }">
      @for (item of visibleItems(); track item.fullSrc) {
        <a class="pool-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          <img [src]="item.thumbSrc" [alt]="item.alt" />
        </a>
      }
    </div>
  `,
})
class PoolGalleryHostComponent {
  private readonly firstPool: NgxImageGalleryItem[] = [
    { fullSrc: 'pool-a-full-1.jpg', thumbSrc: 'pool-a-thumb-1.jpg', alt: 'Pool A first' },
    { fullSrc: 'pool-a-full-2.jpg', thumbSrc: 'pool-a-thumb-2.jpg', alt: 'Pool A second' },
  ];
  private readonly secondPool: NgxImageGalleryItem[] = [
    { fullSrc: 'pool-b-full-1.jpg', thumbSrc: 'pool-b-thumb-1.jpg', alt: 'Pool B first' },
    { fullSrc: 'pool-b-full-2.jpg', thumbSrc: 'pool-b-thumb-2.jpg', alt: 'Pool B second' },
  ];

  readonly visibleItems = signal(this.firstPool);

  showSecondPool(): void {
    this.visibleItems.set(this.secondPool);
  }
}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    <button id="move-last-first" type="button" (click)="moveLastToFirst()">Move last first</button>

    <div ngxImageGallery [ngxImageGallery]="{ showThumbnails: true }">
      @for (item of items(); track item.fullSrc) {
        <a class="ordered-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          <img [src]="item.thumbSrc" [alt]="item.alt" />
        </a>
      }
    </div>
  `,
})
class ReorderedGalleryHostComponent {
  readonly items = signal<NgxImageGalleryItem[]>([
    { fullSrc: 'ordered-a-full.jpg', thumbSrc: 'ordered-a-thumb.jpg', alt: 'Ordered A' },
    { fullSrc: 'ordered-b-full.jpg', thumbSrc: 'ordered-b-thumb.jpg', alt: 'Ordered B' },
    { fullSrc: 'ordered-c-full.jpg', thumbSrc: 'ordered-c-thumb.jpg', alt: 'Ordered C' },
  ]);

  moveLastToFirst(): void {
    const [first, second, third] = this.items();
    this.items.set([third, first, second]);
  }
}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryItemDirective],
  template: `
    @if (showFirstGallery()) {
      <div ngxImageGallery>
        <a id="first-gallery-item" href="first-gallery-full.jpg" [ngxImageGalleryItem]="firstItem">
          <img src="first-gallery-thumb.jpg" alt="First gallery" />
        </a>
      </div>
    }

    <div ngxImageGallery>
      <a id="second-gallery-item" href="second-gallery-full.jpg" [ngxImageGalleryItem]="secondItem">
        <img src="second-gallery-thumb.jpg" alt="Second gallery" />
      </a>
    </div>
  `,
})
class TwoGalleryHostComponent {
  readonly showFirstGallery = signal(true);
  readonly firstItem: NgxImageGalleryItem = {
    fullSrc: 'first-gallery-full.jpg',
    thumbSrc: 'first-gallery-thumb.jpg',
    alt: 'First gallery',
  };
  readonly secondItem: NgxImageGalleryItem = {
    fullSrc: 'second-gallery-full.jpg',
    thumbSrc: 'second-gallery-thumb.jpg',
    alt: 'Second gallery',
  };
}

describe('ngxImageGallery route and pool changes', () => {
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(() => {
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };
  });

  afterEach(() => {
    service?.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
  });

  it('closes the active lightbox when route navigation destroys its gallery', async () => {
    await TestBed.configureTestingModule({
      imports: [RoutedHostComponent],
      providers: [
        provideRouter([
          { path: 'route-a', component: RouteGalleryAComponent },
          { path: 'route-b', component: RouteGalleryBComponent },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RoutedHostComponent);
    const router = TestBed.inject(Router);
    service = TestBed.inject(NgxImageGalleryService);

    await router.navigateByUrl('/route-a');
    fixture.detectChanges();
    await fixture.whenStable();

    click(fixture.nativeElement.querySelector('#route-a-first'));
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
    expect(service.activeItem()?.fullSrc).toBe('route-a-full-1.jpg');

    await router.navigateByUrl('/route-b');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.isOpen()).toBe(false);
    expect(document.querySelector('.ngx-image-gallery-overlay')).toBeFalsy();

    click(fixture.nativeElement.querySelector('#route-b-first'));
    fixture.detectChanges();

    expect(service.activeItem()?.fullSrc).toBe('route-b-full-1.jpg');
    expect(getRenderedImageSources()).not.toContain('route-a-thumb-1.jpg');
  });

  it('opens only the currently registered image pool after the pool changes', async () => {
    await TestBed.configureTestingModule({
      imports: [PoolGalleryHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(PoolGalleryHostComponent);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();

    click(fixture.nativeElement.querySelector('.pool-item'));
    fixture.detectChanges();

    expect(service.activeItem()?.fullSrc).toBe('pool-a-full-1.jpg');

    service.close(false);
    click(fixture.nativeElement.querySelector('#swap-pool'));
    fixture.detectChanges();

    click(fixture.nativeElement.querySelector('.pool-item'));
    fixture.detectChanges();

    expect(service.activeItem()?.fullSrc).toBe('pool-b-full-1.jpg');
    expect(getRenderedImageSources()).not.toContain('pool-a-thumb-1.jpg');
  });

  it('opens reordered gallery items in their current DOM order', async () => {
    await TestBed.configureTestingModule({
      imports: [ReorderedGalleryHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReorderedGalleryHostComponent);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();

    click(fixture.nativeElement.querySelector('#move-last-first'));
    fixture.detectChanges();

    click(fixture.nativeElement.querySelector('.ordered-item'));
    fixture.detectChanges();

    expect(service.activeIndex()).toBe(0);
    expect(service.activeItem()?.fullSrc).toBe('ordered-c-full.jpg');
  });

  it('keeps another gallery open when an inactive gallery is destroyed', async () => {
    await TestBed.configureTestingModule({
      imports: [TwoGalleryHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TwoGalleryHostComponent);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();

    click(fixture.nativeElement.querySelector('#second-gallery-item'));
    fixture.detectChanges();

    expect(service.activeItem()?.fullSrc).toBe('second-gallery-full.jpg');

    fixture.componentInstance.showFirstGallery.set(false);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
    expect(service.activeItem()?.fullSrc).toBe('second-gallery-full.jpg');
  });
});

function click(target: Element | null): void {
  if (!(target instanceof HTMLElement)) {
    throw new Error('Expected a clickable element');
  }

  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
}

function getRenderedImageSources(): string[] {
  return Array.from(document.querySelectorAll<HTMLImageElement>('.ngx-image-gallery-image')).map(
    (image) => image.getAttribute('src') ?? '',
  );
}
