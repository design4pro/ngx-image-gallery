import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import type { NgxImageGalleryItem, NgxImageGalleryOpenOptions } from './gallery-types';
import type { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';

@Directive({
  selector: '[ngxImageGallery]',
  standalone: true,
  exportAs: 'ngxImageGallery',
})
export class NgxImageGalleryDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gallery = inject(NgxImageGalleryService);
  private readonly itemDirectives: NgxImageGalleryItemDirective[] = [];

  readonly ngxImageGallery = input<Partial<NgxImageGalleryOpenOptions> | ''>('');

  register(item: NgxImageGalleryItemDirective): void {
    if (!this.itemDirectives.includes(item)) {
      this.itemDirectives.push(item);
    }
  }

  unregister(item: NgxImageGalleryItemDirective): void {
    const index = this.itemDirectives.indexOf(item);
    if (index >= 0) {
      this.itemDirectives.splice(index, 1);
    }
  }

  open(index = 0): void {
    const items = this.getItems();
    if (items.length === 0) {
      return;
    }

    this.gallery.open(items, index, {
      ...this.getOptions(),
      originElement: this.itemDirectives[index]?.originElement ?? this.elementRef.nativeElement,
      originElements: this.itemDirectives.map((item) => item.originElement),
    });
  }

  openItem(item: NgxImageGalleryItemDirective, event?: MouseEvent): void {
    const index = this.itemDirectives.indexOf(item);
    if (index < 0) {
      return;
    }

    event?.preventDefault();
    this.gallery.open(this.getItems(), index, {
      ...this.getOptions(),
      originElement: item.originElement,
      originElements: this.itemDirectives.map((registeredItem) => registeredItem.originElement),
    });
  }

  private getItems(): NgxImageGalleryItem[] {
    return this.itemDirectives.map((item) => item.galleryItem);
  }

  private getOptions(): Partial<NgxImageGalleryOpenOptions> {
    const options = this.ngxImageGallery();
    return typeof options === 'object' ? options : {};
  }
}
