import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';
import { NgxImageGalleryService } from './ngx-image-gallery.service';
import type {
  NgxImageGalleryItem,
  NgxImageGalleryItemContentTemplate,
  NgxImageGalleryOpenOptions,
} from './gallery-types';
import type { NgxImageGalleryLightboxDirective } from './ngx-image-gallery-lightbox.directive';

export interface NgxImageGalleryRegisteredItem {
  readonly originElement: HTMLElement;
  readonly galleryItem: NgxImageGalleryItem;
  readonly itemContentTemplate?: NgxImageGalleryItemContentTemplate;
}

@Directive({
  selector: '[ngxImageGallery]',
  standalone: true,
  exportAs: 'ngxImageGallery',
})
export class NgxImageGalleryDirective implements OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly gallery = inject(NgxImageGalleryService);
  private readonly owner = {};
  private readonly itemDirectives: NgxImageGalleryRegisteredItem[] = [];
  private lightboxDirective: NgxImageGalleryLightboxDirective | null = null;

  readonly ngxImageGallery = input<Partial<NgxImageGalleryOpenOptions> | ''>('');

  register(item: NgxImageGalleryRegisteredItem): void {
    if (!this.itemDirectives.includes(item)) {
      this.itemDirectives.push(item);
    }
  }

  unregister(item: NgxImageGalleryRegisteredItem): void {
    const index = this.itemDirectives.indexOf(item);
    if (index >= 0) {
      this.itemDirectives.splice(index, 1);
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
    const itemDirectives = this.getOrderedItemDirectives();
    const items = this.getItemsFromDirectives(itemDirectives);
    if (items.length === 0) {
      return;
    }

    this.gallery.open(
      items,
      index,
      {
        ...this.getOptions(),
        ...this.getLightboxOptions(),
        originElement: itemDirectives[index]?.originElement ?? this.elementRef.nativeElement,
        originElements: itemDirectives.map((item) => item.originElement),
        itemContentTemplates: itemDirectives.map((item) => item.itemContentTemplate),
      },
      this.owner,
    );
  }

  openItem(item: NgxImageGalleryRegisteredItem, event?: Event): void {
    const itemDirectives = this.getOrderedItemDirectives();
    const index = itemDirectives.indexOf(item);
    if (index < 0) {
      return;
    }

    event?.preventDefault();
    this.gallery.open(
      this.getItemsFromDirectives(itemDirectives),
      index,
      {
        ...this.getOptions(),
        ...this.getLightboxOptions(),
        originElement: item.originElement,
        originElements: itemDirectives.map((registeredItem) => registeredItem.originElement),
        itemContentTemplates: itemDirectives.map(
          (registeredItem) => registeredItem.itemContentTemplate,
        ),
      },
      this.owner,
    );
  }

  getItems(): NgxImageGalleryItem[] {
    return this.getItemsFromDirectives(this.getOrderedItemDirectives());
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

  private getOrderedItemDirectives(): NgxImageGalleryRegisteredItem[] {
    return [...this.itemDirectives].sort((first, second) => {
      if (first === second) {
        return 0;
      }

      const firstIndex = this.itemDirectives.indexOf(first);
      const secondIndex = this.itemDirectives.indexOf(second);
      const firstElement = first.originElement;
      const secondElement = second.originElement;

      if (!firstElement.isConnected || !secondElement.isConnected) {
        return firstIndex - secondIndex;
      }

      const position = firstElement.compareDocumentPosition(secondElement);
      if (position & firstElement.DOCUMENT_POSITION_DISCONNECTED) {
        return firstIndex - secondIndex;
      }
      if (position & firstElement.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (position & firstElement.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }

      return firstIndex - secondIndex;
    });
  }

  private getItemsFromDirectives(
    itemDirectives: readonly NgxImageGalleryRegisteredItem[],
  ): NgxImageGalleryItem[] {
    return itemDirectives.map((item) => item.galleryItem);
  }
}
