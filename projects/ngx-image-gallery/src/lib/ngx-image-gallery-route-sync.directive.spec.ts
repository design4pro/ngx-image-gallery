import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import type { NgxImageGalleryItem } from './gallery-types';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import { NgxImageGalleryRouteSyncDirective } from '../../router/src/ngx-image-gallery-route-sync.directive';

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
      providers: [provideRouter([{ path: 'sync', component: RouteSyncGalleryComponent }])],
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
    await navigateTo('/sync?image=missing');
    await fixture.whenStable();

    expect(service.isOpen()).toBe(false);
    expect(router.url).toBe('/sync');
  });

  async function navigateTo(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }
});
