import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  contentChildren,
  inject,
} from '@angular/core';
import type { NgxImageGalleryItem } from './gallery-types';
import {
  NgxImageGalleryDirective,
  type NgxImageGalleryRegisteredItem,
} from './ngx-image-gallery.directive';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';

interface AutoDiscoveredItem extends NgxImageGalleryRegisteredItem {
  readonly activationElement: HTMLElement;
  readonly restore: () => void;
  readonly removeListeners: () => void;
}

@Directive({
  selector: '[ngxImageGalleryAuto]',
  standalone: true,
})
export class NgxImageGalleryAutoDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly parentGallery = inject(NgxImageGalleryDirective, {
    host: true,
    optional: true,
  });
  private readonly explicitItems = contentChildren(NgxImageGalleryItemDirective, {
    descendants: true,
  });
  private readonly items: AutoDiscoveredItem[] = [];

  ngAfterViewInit(): void {
    if (!this.parentGallery) {
      return;
    }

    for (const item of this.discoverItems()) {
      this.items.push(item);
      this.parentGallery.register(item);
    }
  }

  ngOnDestroy(): void {
    for (const item of this.items) {
      item.removeListeners();
      item.restore();
      this.parentGallery?.unregister(item);
    }
    this.items.length = 0;
  }

  private discoverItems(): AutoDiscoveredItem[] {
    const host = this.elementRef.nativeElement;
    const discoveredItems: AutoDiscoveredItem[] = [];
    const usedOrigins = new Set<HTMLElement>();

    for (const image of Array.from(host.querySelectorAll('img'))) {
      if (this.isExplicitGalleryItem(image)) {
        continue;
      }

      const link = this.getLinkedOrigin(image);
      if (link?.hasAttribute('download')) {
        continue;
      }

      const activationElement = link ?? image;
      if (usedOrigins.has(activationElement)) {
        continue;
      }

      const galleryItem = this.createGalleryItem(image, link);
      if (!galleryItem) {
        continue;
      }

      const restore = link ? () => undefined : this.prepareStandaloneImage(image);
      const item = this.createDiscoveredItem(activationElement, galleryItem, restore, !link);
      discoveredItems.push(item);
      usedOrigins.add(activationElement);
    }

    return discoveredItems;
  }

  private isExplicitGalleryItem(image: HTMLImageElement): boolean {
    return this.explicitItems().some((item) => item.originElement.contains(image));
  }

  private getLinkedOrigin(image: HTMLImageElement): HTMLAnchorElement | null {
    const link = image.closest<HTMLAnchorElement>('a[href]');
    return link && this.elementRef.nativeElement.contains(link) ? link : null;
  }

  private createGalleryItem(
    image: HTMLImageElement,
    link: HTMLAnchorElement | null,
  ): NgxImageGalleryItem | null {
    const imageSrc = readAttribute(image, 'src');
    const fullSrc = readAttribute(link, 'href') ?? imageSrc;
    if (!fullSrc) {
      return null;
    }

    return {
      fullSrc,
      thumbSrc: imageSrc ?? fullSrc,
      alt: image.getAttribute('alt') ?? undefined,
      srcset: readAttribute(image, 'srcset'),
      sizes: readAttribute(image, 'sizes'),
      width: readPositiveNumberAttribute(image, 'width'),
      height: readPositiveNumberAttribute(image, 'height'),
    };
  }

  private prepareStandaloneImage(image: HTMLImageElement): () => void {
    const hadRole = image.hasAttribute('role');
    const previousRole = image.getAttribute('role');
    const hadTabIndex = image.hasAttribute('tabindex');
    const previousTabIndex = image.getAttribute('tabindex');
    const hadAriaLabel = image.hasAttribute('aria-label');
    const previousAriaLabel = image.getAttribute('aria-label');

    if (!hadRole) {
      image.setAttribute('role', 'button');
    }
    if (!hadTabIndex) {
      image.tabIndex = 0;
    }
    if (
      !hadAriaLabel &&
      !image.hasAttribute('aria-labelledby') &&
      image.getAttribute('alt')?.trim()
    ) {
      image.setAttribute('aria-label', image.getAttribute('alt') ?? '');
    }

    return () => {
      restoreAttribute(image, 'role', hadRole, previousRole);
      restoreAttribute(image, 'tabindex', hadTabIndex, previousTabIndex);
      restoreAttribute(image, 'aria-label', hadAriaLabel, previousAriaLabel);
    };
  }

  private createDiscoveredItem(
    activationElement: HTMLElement,
    galleryItem: NgxImageGalleryItem,
    restore: () => void,
    enableKeyboardActivation: boolean,
  ): AutoDiscoveredItem {
    const item: AutoDiscoveredItem = {
      activationElement,
      originElement: activationElement,
      galleryItem,
      restore,
      removeListeners: () => {
        activationElement.removeEventListener('click', onClick);
        activationElement.removeEventListener('keydown', onKeydown);
      },
    };

    const onClick = (event: MouseEvent): void => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      this.parentGallery?.openItem(item, event);
    };

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
        return;
      }

      this.parentGallery?.openItem(item, event);
    };

    activationElement.addEventListener('click', onClick);
    if (enableKeyboardActivation) {
      activationElement.addEventListener('keydown', onKeydown);
    }

    return item;
  }
}

function readAttribute(element: Element | null, name: string): string | undefined {
  const value = element?.getAttribute(name)?.trim();
  return value ? value : undefined;
}

function readPositiveNumberAttribute(element: Element, name: string): number | undefined {
  const value = readAttribute(element, name);
  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

function restoreAttribute(
  element: Element,
  name: string,
  hadAttribute: boolean,
  previousValue: string | null,
): void {
  if (hadAttribute && previousValue !== null) {
    element.setAttribute(name, previousValue);
  } else {
    element.removeAttribute(name);
  }
}
