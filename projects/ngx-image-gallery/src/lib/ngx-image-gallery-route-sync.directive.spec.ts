import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NgxImageGalleryRouteSyncDirective } from 'ngx-image-gallery/router';
import type { NgxImageGalleryItem } from './gallery-types';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import { NgxImageGalleryService } from './ngx-image-gallery.service';

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class RoutedRouteSyncHostComponent {}

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryRouteSyncDirective,
  ],
  template: `
    <div
      ngxImageGallery
      [ngxImageGalleryRouteSync]="{
        queryParam: 'image',
        id: imageId,
        slideNavigation: 'push',
      }"
    >
      @for (item of items; track item.id) {
        <a class="route-sync-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          <img [src]="item.thumbSrc" [alt]="item.alt" />
        </a>
      }
    </div>
  `,
})
class RouteSyncGalleryComponent {
  readonly items: NgxImageGalleryItem[] = [
    { id: 'first', fullSrc: 'route-sync-full-1.jpg', thumbSrc: 'route-sync-thumb-1.jpg' },
    { id: 'second', fullSrc: 'route-sync-full-2.jpg', thumbSrc: 'route-sync-thumb-2.jpg' },
  ];

  readonly imageId = (item: NgxImageGalleryItem, index: number): string => item.id ?? String(index);
}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryRouteSyncDirective],
  template: `
    <div
      ngxImageGallery
      [ngxImageGalleryRouteSync]="{
        queryParam: 'image',
        id: imageId,
      }"
    ></div>
  `,
})
class AsyncRouteSyncGalleryComponent {
  @ViewChild(NgxImageGalleryDirective, { static: true })
  private readonly gallery!: NgxImageGalleryDirective;

  readonly imageId = (item: NgxImageGalleryItem, index: number): string => item.id ?? String(index);

  loadItems(): void {
    this.gallery.register(createGalleryItemDirective('first'));
    this.gallery.register(createGalleryItemDirective('second'));
  }
}

function createGalleryItemDirective(id: string): NgxImageGalleryItemDirective {
  const originElement = document.createElement('a');
  return {
    originElement,
    galleryItem: {
      id,
      fullSrc: `async-route-sync-full-${id}.jpg`,
    },
  } as unknown as NgxImageGalleryItemDirective;
}

describe('NgxImageGalleryRouteSyncDirective', () => {
  let fixture: ComponentFixture<RoutedRouteSyncHostComponent>;
  let router: Router;
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(async () => {
    vi.useFakeTimers();
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };

    await TestBed.configureTestingModule({
      imports: [RoutedRouteSyncHostComponent],
      providers: [
        provideRouter([
          { path: 'sync', component: RouteSyncGalleryComponent },
          { path: 'async', component: AsyncRouteSyncGalleryComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoutedRouteSyncHostComponent);
    router = TestBed.inject(Router);
    service = TestBed.inject(NgxImageGalleryService);
  });

  afterEach(() => {
    service.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('opens the route-selected image from a query parameter', async () => {
    await navigateTo('/sync?image=second');

    expect(service.isOpen()).toBe(true);
    expect(service.activeIndex()).toBe(1);
    expect(service.activeItem()?.id).toBe('second');
  });

  it('updates the query parameter when the active slide changes', async () => {
    await navigateTo('/sync?image=first');
    vi.advanceTimersByTime(333);

    service.next();
    vi.advanceTimersByTime(220);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/sync?image=second');
  });

  it('closes the managed lightbox when the query parameter is removed', async () => {
    await navigateTo('/sync?image=first');

    await navigateTo('/sync');
    vi.advanceTimersByTime(333);

    expect(service.isOpen()).toBe(false);
    expect(document.querySelector('.ngx-image-gallery-overlay')).toBeFalsy();
  });

  it('removes a missing image id from the route', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    await navigateTo('/sync?image=missing');
    await fixture.whenStable();

    expect(service.isOpen()).toBe(false);
    expect(router.url).toBe('/sync');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        replaceUrl: true,
      }),
    );
  });

  it('opens a deep-linked image after async items register', async () => {
    await navigateTo('/async?image=second');

    expect(service.isOpen()).toBe(false);
    expect(router.url).toBe('/async?image=second');

    const gallery = fixture.debugElement.query(By.directive(AsyncRouteSyncGalleryComponent))
      .componentInstance as AsyncRouteSyncGalleryComponent;

    gallery.loadItems();
    await Promise.resolve();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.isOpen()).toBe(true);
    expect(service.activeIndex()).toBe(1);
    expect(service.activeItem()?.id).toBe('second');
    expect(router.url).toBe('/async?image=second');
  });

  async function navigateTo(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }
});
