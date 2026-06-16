import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  input,
} from '@angular/core';
import type { NgxImageGalleryItem } from './gallery-types';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';

@Directive({
  selector: '[ngxImageGalleryItem]',
  standalone: true,
})
export class NgxImageGalleryItemDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly parentGallery = inject(NgxImageGalleryDirective, {
    host: true,
    optional: true,
  });

  readonly ngxImageGalleryItem = input.required<NgxImageGalleryItem | string>();

  get originElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  get galleryItem(): NgxImageGalleryItem {
    const item = this.ngxImageGalleryItem();
    return typeof item === 'string' ? { fullSrc: item } : item;
  }

  ngOnInit(): void {
    this.parentGallery?.register(this);
  }

  ngOnDestroy(): void {
    this.parentGallery?.unregister(this);
  }

  @HostListener('click', ['$event'])
  protected onClick(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    this.parentGallery?.openItem(this, event);
  }
}
