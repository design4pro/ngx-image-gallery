import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { NgxImageGalleryService } from '@design4pro/ngx-image-gallery';
import { TailwindGalleryExample } from './tailwind-gallery-example';

describe('TailwindGalleryExample', () => {
  let fixture: ComponentFixture<TailwindGalleryExample>;
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(async () => {
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };

    await TestBed.configureTestingModule({
      imports: [TailwindGalleryExample],
    }).compileComponents();

    fixture = TestBed.createComponent(TailwindGalleryExample);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();
  });

  afterEach(() => {
    service.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
  });

  it('reserves vertical space around active lightbox thumbnails', () => {
    const firstTile = fixture.nativeElement.querySelector(
      'a[href^="https://picsum.photos"]',
    ) as HTMLAnchorElement | null;

    firstTile?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    const thumbnails = document.querySelector<HTMLElement>('[aria-label="Gallery thumbnails"]');

    expect(thumbnails?.classList.contains('p-1')).toBe(true);
  });

  it('keeps the custom lightbox template accessible', async () => {
    const firstTile = fixture.nativeElement.querySelector(
      'a[href^="https://picsum.photos"]',
    ) as HTMLAnchorElement | null;

    firstTile?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    const counter = document.querySelector<HTMLElement>(
      '[data-testid="tailwind-lightbox-counter"]',
    );
    const closeButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="tailwind-lightbox-close"]',
    );

    expect(counter?.getAttribute('aria-live')).toBe('polite');
    expect(closeButton?.getAttribute('aria-label')).toBe('Close gallery');

    const results = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
