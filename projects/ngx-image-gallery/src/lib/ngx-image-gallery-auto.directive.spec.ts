import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgxImageGalleryAutoDirective } from './ngx-image-gallery-auto.directive';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import type { NgxImageGalleryItem } from './gallery-types';

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryAutoDirective],
  template: `
    <div ngxImageGallery ngxImageGalleryAuto>
      <article>
        <a id="linked-photo" href="full-linked.jpg">
          <img
            src="thumb-linked.jpg"
            srcset="full-linked-800.jpg 800w, full-linked-1600.jpg 1600w"
            sizes="(min-width: 800px) 50vw, 100vw"
            alt="Linked mountain lake"
            width="1600"
            height="900"
          />
        </a>

        <img id="standalone-photo" src="standalone.jpg" alt="Standalone city skyline" />

        <a id="download-photo" href="download.jpg" download>
          <img src="download-thumb.jpg" alt="Download only" />
        </a>
      </article>
    </div>
  `,
})
class AutoGalleryHostComponent {}

@Component({
  imports: [NgxImageGalleryDirective, NgxImageGalleryAutoDirective, NgxImageGalleryItemDirective],
  template: `
    <div ngxImageGallery ngxImageGalleryAuto>
      <a id="explicit-photo" href="explicit-link.jpg" [ngxImageGalleryItem]="explicitItem">
        <img src="explicit-thumb.jpg" alt="Explicit image" />
      </a>

      <img id="auto-photo" src="auto.jpg" alt="Auto image" />
    </div>
  `,
})
class MixedGalleryHostComponent {
  readonly explicitItem: NgxImageGalleryItem = {
    fullSrc: 'explicit-full.jpg',
    thumbSrc: 'explicit-thumb.jpg',
    alt: 'Explicit image',
  };
}

describe('NgxImageGalleryAutoDirective', () => {
  let fixture: ComponentFixture<AutoGalleryHostComponent>;
  let service: NgxImageGalleryService;
  let originalAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(async () => {
    originalAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    };

    await TestBed.configureTestingModule({
      imports: [AutoGalleryHostComponent, MixedGalleryHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AutoGalleryHostComponent);
    service = TestBed.inject(NgxImageGalleryService);
    fixture.detectChanges();
  });

  afterEach(() => {
    service.close(false);
    window.requestAnimationFrame = originalAnimationFrame;
    document.body.innerHTML = '';
  });

  it('discovers linked images and maps supported attributes to gallery items', () => {
    const link = fixture.nativeElement.querySelector('#linked-photo') as HTMLAnchorElement;

    click(link);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
    expect(service.activeItem()).toEqual({
      fullSrc: 'full-linked.jpg',
      thumbSrc: 'thumb-linked.jpg',
      alt: 'Linked mountain lake',
      srcset: 'full-linked-800.jpg 800w, full-linked-1600.jpg 1600w',
      sizes: '(min-width: 800px) 50vw, 100vw',
      width: 1600,
      height: 900,
    });
    expect(link.querySelector('img')?.getAttribute('alt')).toBe('Linked mountain lake');
  });

  it('makes standalone images keyboard activatable with their alt text as the name', () => {
    const image = fixture.nativeElement.querySelector('#standalone-photo') as HTMLImageElement;

    expect(image.getAttribute('role')).toBe('button');
    expect(image.getAttribute('tabindex')).toBe('0');
    expect(image.getAttribute('aria-label')).toBe('Standalone city skyline');

    keydown(image, 'Enter');
    fixture.detectChanges();

    expect(service.isOpen()).toBe(true);
    expect(service.activeItem()).toMatchObject({
      fullSrc: 'standalone.jpg',
      thumbSrc: 'standalone.jpg',
      alt: 'Standalone city skyline',
    });
  });

  it('opens standalone images from Space key activation', () => {
    const image = fixture.nativeElement.querySelector('#standalone-photo') as HTMLImageElement;

    keydown(image, ' ');
    fixture.detectChanges();

    expect(service.activeItem()?.fullSrc).toBe('standalone.jpg');
  });

  it('does not add Space key activation to linked images', () => {
    const link = fixture.nativeElement.querySelector('#linked-photo') as HTMLAnchorElement;

    const event = keydown(link, ' ');
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(service.isOpen()).toBe(false);
  });

  it('does not intercept download links', () => {
    const link = fixture.nativeElement.querySelector('#download-photo') as HTMLAnchorElement;

    click(link);
    fixture.detectChanges();

    expect(service.isOpen()).toBe(false);
  });

  it('does not duplicate explicit gallery items', async () => {
    const mixedFixture = TestBed.createComponent(MixedGalleryHostComponent);
    mixedFixture.detectChanges();
    await mixedFixture.whenStable();

    const gallery = mixedFixture.debugElement
      .query(By.directive(NgxImageGalleryDirective))
      .injector.get(NgxImageGalleryDirective);

    expect(gallery.getItems().map((item) => item.fullSrc)).toEqual([
      'explicit-full.jpg',
      'auto.jpg',
    ]);

    click(mixedFixture.nativeElement.querySelector('#explicit-photo'));
    mixedFixture.detectChanges();

    expect(service.activeItem()?.fullSrc).toBe('explicit-full.jpg');
  });
});

function click(target: Element | null): void {
  if (!(target instanceof HTMLElement)) {
    throw new Error('Expected a clickable element');
  }

  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
}

function keydown(target: Element | null, key: string): KeyboardEvent {
  if (!(target instanceof HTMLElement)) {
    throw new Error('Expected a keyboard target');
  }

  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  return event;
}
