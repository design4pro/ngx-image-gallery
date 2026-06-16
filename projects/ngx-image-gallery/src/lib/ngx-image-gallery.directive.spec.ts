import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
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
});
