import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap, type ParamMap } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { NgxImageGalleryUrlStateDirective } from '@design4pro/ngx-image-gallery/router';
import type { NgxImageGalleryItem } from './gallery-types';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import { NgxImageGalleryService } from './ngx-image-gallery.service';

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryUrlStateDirective,
  ],
  template: `
    <div ngxImageGallery ngxImageGalleryUrlState="product-gallery">
      @for (item of items; track item.id) {
        <a class="url-state-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          {{ item.id }}
        </a>
      }
    </div>
  `,
})
class UrlStateGalleryComponent {
  items: NgxImageGalleryItem[] = [
    { id: 'first', fullSrc: 'url-state-full-1.jpg' },
    { id: 'second', fullSrc: 'url-state-full-2.jpg' },
  ];
}

@Component({
  imports: [
    NgxImageGalleryDirective,
    NgxImageGalleryItemDirective,
    NgxImageGalleryUrlStateDirective,
  ],
  template: `
    <div ngxImageGallery ngxImageGalleryUrlState="secondary-gallery">
      @for (item of items; track item.id) {
        <a class="url-state-item" [href]="item.fullSrc" [ngxImageGalleryItem]="item">
          {{ item.id }}
        </a>
      }
    </div>
  `,
})
class SecondaryUrlStateGalleryComponent {
  readonly items: NgxImageGalleryItem[] = [
    { id: 'first', fullSrc: 'secondary-full-1.jpg' },
    { id: 'second', fullSrc: 'secondary-full-2.jpg' },
  ];
}

describe('NgxImageGalleryUrlStateDirective', () => {
  let fixture: ComponentFixture<UrlStateGalleryComponent>;
  let service: NgxImageGalleryService;
  let queryParamMap: BehaviorSubject<ParamMap>;
  let navigate: ReturnType<typeof vi.fn>;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(async () => {
    vi.useFakeTimers();
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };
    queryParamMap = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    navigate = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [UrlStateGalleryComponent, SecondaryUrlStateGalleryComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: {
            events: new Subject(),
            navigate,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    service.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('opens the matching stable item from URL query state after items register', async () => {
    queryParamMap.next(
      convertToParamMap({
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'second',
      }),
    );
    createFixture();
    await flushEffects();

    expect(service.isOpen()).toBe(true);
    expect(service.activeItem()?.id).toBe('second');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores missing URL item ids without falling back to an index', async () => {
    queryParamMap.next(
      convertToParamMap({
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'missing',
      }),
    );
    createFixture();
    await flushEffects();

    expect(service.isOpen()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('pushes URL state when the user opens an item', async () => {
    createFixture();
    openGallery(0);
    await flushEffects();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: {
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'first',
      },
      queryParamsHandling: 'merge',
      replaceUrl: false,
    });
  });

  it('replaces URL state when slide navigation changes the active item', async () => {
    createFixture();
    openGallery(0);
    await flushEffects();
    navigate.mockClear();

    service.next();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    await flushEffects();

    expect(service.activeItem()?.id).toBe('second');
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: {
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'second',
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('clears owned URL state when the gallery closes', async () => {
    queryParamMap.next(
      convertToParamMap({
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'first',
      }),
    );
    createFixture();
    await flushEffects();
    navigate.mockClear();

    service.close(false);
    fixture.detectChanges();
    await flushEffects();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: {
        ngxGallery: null,
        ngxGalleryItem: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('does not clear URL state for another gallery id', async () => {
    const secondaryFixture = TestBed.createComponent(SecondaryUrlStateGalleryComponent);
    service = TestBed.inject(NgxImageGalleryService);
    secondaryFixture.detectChanges();
    queryParamMap.next(
      convertToParamMap({
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'first',
      }),
    );
    await flushEffects();
    navigate.mockClear();

    service.close(false);
    secondaryFixture.detectChanges();
    await flushEffects();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('closes the owned lightbox when browser navigation clears the gallery state', async () => {
    queryParamMap.next(
      convertToParamMap({
        ngxGallery: 'product-gallery',
        ngxGalleryItem: 'first',
      }),
    );
    createFixture();
    await flushEffects();

    queryParamMap.next(convertToParamMap({}));
    await flushEffects();

    expect(service.isOpen()).toBe(false);
  });

  function createFixture(): void {
    fixture = TestBed.createComponent(UrlStateGalleryComponent);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();
  }

  function openGallery(index: number): void {
    const gallery = fixture.debugElement
      .query(By.directive(NgxImageGalleryDirective))
      .injector.get(NgxImageGalleryDirective);

    gallery.open(index);
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
  }

  async function flushEffects(): Promise<void> {
    await Promise.resolve();
    fixture?.detectChanges();
    await Promise.resolve();
  }
});
