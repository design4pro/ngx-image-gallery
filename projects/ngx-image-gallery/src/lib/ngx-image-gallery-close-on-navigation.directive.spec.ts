import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NgxImageGalleryCloseOnNavigationDirective } from 'ngx-image-gallery/router';
import type { NgxImageGalleryItem } from './gallery-types';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import { NgxImageGalleryService } from './ngx-image-gallery.service';

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryCloseOnNavigationDirective,
  ],
  template: `
    <div ngxImageGallery ngxImageGalleryCloseOnNavigation>
      @for (item of items; track item.id) {
        <a class="navigation-close-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          {{ item.id }}
        </a>
      }
    </div>
  `,
})
class CloseOnNavigationGalleryComponent {
  readonly items: NgxImageGalleryItem[] = [
    { id: 'first', fullSrc: 'navigation-close-full-1.jpg' },
    { id: 'second', fullSrc: 'navigation-close-full-2.jpg' },
  ];
}

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryCloseOnNavigationDirective,
  ],
  template: `
    <div
      ngxImageGallery
      [ngxImageGalleryCloseOnNavigation]="{
        closeOnNavigation: false,
        closeOnHistoryBack: true,
      }"
    >
      @for (item of items; track item.id) {
        <a class="navigation-close-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          {{ item.id }}
        </a>
      }
    </div>
  `,
})
class HistoryOnlyCloseOnNavigationGalleryComponent {
  readonly items: NgxImageGalleryItem[] = [
    { id: 'first', fullSrc: 'navigation-close-full-1.jpg' },
    { id: 'second', fullSrc: 'navigation-close-full-2.jpg' },
  ];
}

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryCloseOnNavigationDirective,
  ],
  template: `
    <div ngxImageGallery [ngxImageGalleryCloseOnNavigation]="false">
      @for (item of items; track item.id) {
        <a class="navigation-close-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          {{ item.id }}
        </a>
      }
    </div>
  `,
})
class DisabledCloseOnNavigationGalleryComponent {
  readonly items: NgxImageGalleryItem[] = [
    { id: 'first', fullSrc: 'navigation-close-full-1.jpg' },
    { id: 'second', fullSrc: 'navigation-close-full-2.jpg' },
  ];
}

describe('NgxImageGalleryCloseOnNavigationDirective', () => {
  let fixture: ComponentFixture<unknown>;
  let routerEvents: Subject<NavigationStart>;
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(async () => {
    vi.useFakeTimers();
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };
    routerEvents = new Subject<NavigationStart>();

    await TestBed.configureTestingModule({
      imports: [
        CloseOnNavigationGalleryComponent,
        HistoryOnlyCloseOnNavigationGalleryComponent,
        DisabledCloseOnNavigationGalleryComponent,
      ],
      providers: [
        {
          provide: Router,
          useValue: {
            events: routerEvents.asObservable(),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    service.close(false);
    routerEvents.complete();
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('closes the owned lightbox on route navigation by default', () => {
    createFixture(CloseOnNavigationGalleryComponent);
    openGallery();

    routerEvents.next(new NavigationStart(1, '/next', 'imperative'));
    vi.advanceTimersByTime(333);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(false);
    expect(document.querySelector('.ngx-image-gallery-overlay')).toBeFalsy();
  });

  it('can close only for history navigation', () => {
    createFixture(HistoryOnlyCloseOnNavigationGalleryComponent);
    openGallery();

    routerEvents.next(new NavigationStart(1, '/next', 'imperative'));
    vi.advanceTimersByTime(333);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);

    routerEvents.next(new NavigationStart(2, '/previous', 'popstate'));
    vi.advanceTimersByTime(333);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(false);
  });

  it('can be disabled', () => {
    createFixture(DisabledCloseOnNavigationGalleryComponent);
    openGallery();

    routerEvents.next(new NavigationStart(1, '/next', 'imperative'));
    routerEvents.next(new NavigationStart(2, '/previous', 'popstate'));
    vi.advanceTimersByTime(333);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
  });

  function createFixture<T>(component: new () => T): void {
    fixture = TestBed.createComponent(component);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();
  }

  function openGallery(): void {
    const gallery = fixture.debugElement
      .query(By.directive(NgxImageGalleryDirective))
      .injector.get(NgxImageGalleryDirective);

    gallery.open(0);
    vi.advanceTimersByTime(333);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
  }
});
