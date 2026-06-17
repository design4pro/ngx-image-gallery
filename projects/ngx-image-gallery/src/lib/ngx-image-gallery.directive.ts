import { Directive, ElementRef, OnDestroy, inject, input, signal } from '@angular/core';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import type { NgxImageGalleryItem, NgxImageGalleryOpenOptions } from './gallery-types';
import type { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';
import type { NgxImageGalleryLightboxDirective } from './ngx-image-gallery-lightbox.directive';

@Directive({
  selector: '[ngxImageGallery]',
  standalone: true,
  exportAs: 'ngxImageGallery',
})
export class NgxImageGalleryDirective implements OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gallery = inject(NgxImageGalleryService);
  private readonly owner = {};
  private readonly itemDirectives: NgxImageGalleryItemDirective[] = [];
  private readonly itemsVersionState = signal(0);
  readonly itemsVersion = this.itemsVersionState.asReadonly();
  private isItemsVersionUpdateQueued = false;
  private isDestroyed = false;
  private lightboxDirective: NgxImageGalleryLightboxDirective | null = null;

  readonly ngxImageGallery = input<Partial<NgxImageGalleryOpenOptions> | ''>('');

  register(item: NgxImageGalleryItemDirective): void {
    if (!this.itemDirectives.includes(item)) {
      this.itemDirectives.push(item);
      this.queueItemsVersionUpdate();
    }
  }

  unregister(item: NgxImageGalleryItemDirective): void {
    const index = this.itemDirectives.indexOf(item);
    if (index >= 0) {
      this.itemDirectives.splice(index, 1);
      this.queueItemsVersionUpdate();
    }
  }

  registerLightbox(lightbox: NgxImageGalleryLightboxDirective): void {
    this.lightboxDirective = lightbox;
  }

  unregisterLightbox(lightbox: NgxImageGalleryLightboxDirective): void {
    if (this.lightboxDirective === lightbox) {
      this.lightboxDirective = null;
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.gallery.closeOwnedBy(this.owner, false);
    this.itemDirectives.length = 0;
    this.lightboxDirective = null;
  }

  ownsActiveLightbox(): boolean {
    return this.gallery.isOpenOwnedBy(this.owner);
  }

  close(animate = true): void {
    this.gallery.closeOwnedBy(this.owner, animate);
  }

  open(index = 0): void {
    const items = this.getItems();
    if (items.length === 0) {
      return;
    }

    this.gallery.open(
      items,
      index,
      {
        ...this.getOptions(),
        ...this.getLightboxOptions(),
        originElement: this.itemDirectives[index]?.originElement ?? this.elementRef.nativeElement,
        originElements: this.itemDirectives.map((item) => item.originElement),
      },
      this.owner,
    );
  }

  openItem(item: NgxImageGalleryItemDirective, event?: MouseEvent): void {
    const index = this.itemDirectives.indexOf(item);
    if (index < 0) {
      return;
    }

    event?.preventDefault();
    this.gallery.open(
      this.getItems(),
      index,
      {
        ...this.getOptions(),
        ...this.getLightboxOptions(),
        originElement: item.originElement,
        originElements: this.itemDirectives.map((registeredItem) => registeredItem.originElement),
      },
      this.owner,
    );
  }

  getItems(): NgxImageGalleryItem[] {
    return this.itemDirectives.map((item) => item.galleryItem);
  }

  private getOptions(): Partial<NgxImageGalleryOpenOptions> {
    const options = this.ngxImageGallery();
    return typeof options === 'object' ? options : {};
  }

  private getLightboxOptions(): Pick<
    NgxImageGalleryOpenOptions,
    'lightboxTemplate' | 'lightboxViewContainer'
  > {
    return this.lightboxDirective
      ? {
          lightboxTemplate: this.lightboxDirective.templateRef,
          lightboxViewContainer: this.lightboxDirective.viewContainerRef,
        }
      : {};
  }

  private queueItemsVersionUpdate(): void {
    if (this.isItemsVersionUpdateQueued) {
      return;
    }

    this.isItemsVersionUpdateQueued = true;
    queueMicrotask(() => {
      this.isItemsVersionUpdateQueued = false;
      if (!this.isDestroyed) {
        this.itemsVersionState.update((version) => version + 1);
      }
    });
  }
}
