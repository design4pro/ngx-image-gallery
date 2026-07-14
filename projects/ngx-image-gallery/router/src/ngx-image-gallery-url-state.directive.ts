import { Directive, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, type ParamMap } from '@angular/router';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryService,
  type NgxImageGalleryItem,
} from '@design4pro/ngx-image-gallery';

const GALLERY_QUERY_PARAM = 'ngxGallery';
const ITEM_QUERY_PARAM = 'ngxGalleryItem';

export interface NgxImageGalleryUrlStateOptions {
  galleryId: string;
}

interface NormalizedUrlStateOptions {
  galleryId: string;
}

interface QueryGalleryState {
  galleryId: string | null;
  itemId: string | null;
}

@Directive({
  selector: '[ngxImageGalleryUrlState]',
  standalone: true,
})
export class NgxImageGalleryUrlStateDirective {
  private readonly gallery = inject(NgxImageGalleryDirective, { host: true });
  private readonly galleryService = inject(NgxImageGalleryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly ngxImageGalleryUrlState = input<NgxImageGalleryUrlStateOptions | string | ''>('');

  private readonly queryState = signal<QueryGalleryState>({
    galleryId: null,
    itemId: null,
  });
  private readonly options = computed<NormalizedUrlStateOptions | null>(() => {
    const value = this.ngxImageGalleryUrlState();
    const galleryId = typeof value === 'string' ? value : value.galleryId;
    const trimmed = galleryId.trim();

    return trimmed ? { galleryId: trimmed } : null;
  });
  private isApplyingUrlState = false;
  private lastQueryWasOwnGallery = false;
  private wasOwnedOpen = false;

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.applyQueryParamMap(params));

    effect(() => {
      this.gallery.itemsVersion();
      this.queryState();
      this.syncUrlToGallery();
    });

    effect(() => {
      this.galleryService.isOpen();
      this.galleryService.activeItem();
      this.queryState();
      this.syncGalleryToUrl();
    });
  }

  private applyQueryParamMap(params: ParamMap): void {
    this.queryState.set({
      galleryId: params.get(GALLERY_QUERY_PARAM),
      itemId: params.get(ITEM_QUERY_PARAM),
    });
  }

  private syncUrlToGallery(): void {
    const options = this.options();
    if (!options) {
      return;
    }

    const queryState = this.queryState();
    if (queryState.galleryId !== options.galleryId) {
      if (this.lastQueryWasOwnGallery && this.gallery.ownsActiveLightbox()) {
        this.runFromUrlState(() => this.gallery.close(false));
      }
      this.lastQueryWasOwnGallery = false;
      return;
    }

    this.lastQueryWasOwnGallery = true;
    if (!queryState.itemId) {
      if (this.gallery.ownsActiveLightbox()) {
        this.runFromUrlState(() => this.gallery.close(false));
      }
      return;
    }

    const items = this.gallery.getItems();
    const index = items.findIndex((item) => item.id === queryState.itemId);
    if (index < 0) {
      return;
    }

    if (
      this.gallery.ownsActiveLightbox() &&
      untracked(() => this.galleryService.activeItem()?.id) === queryState.itemId
    ) {
      this.wasOwnedOpen = true;
      return;
    }

    this.wasOwnedOpen = true;
    this.runFromUrlState(() => this.gallery.open(index));
  }

  private syncGalleryToUrl(): void {
    const options = this.options();
    if (!options) {
      return;
    }

    const isOwnedOpen = this.galleryService.isOpen() && this.gallery.ownsActiveLightbox();
    if (this.isApplyingUrlState) {
      this.wasOwnedOpen = isOwnedOpen;
      return;
    }

    if (!isOwnedOpen) {
      if (this.wasOwnedOpen) {
        this.wasOwnedOpen = false;
        this.clearUrlState(options);
      }
      return;
    }

    const activeItem = this.galleryService.activeItem();
    const activeItemId = getStableItemId(activeItem);
    if (!activeItemId) {
      this.wasOwnedOpen = true;
      this.clearUrlState(options);
      return;
    }

    const queryState = this.queryState();
    if (queryState.galleryId === options.galleryId && queryState.itemId === activeItemId) {
      this.wasOwnedOpen = true;
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [GALLERY_QUERY_PARAM]: options.galleryId,
        [ITEM_QUERY_PARAM]: activeItemId,
      },
      queryParamsHandling: 'merge',
      replaceUrl: this.wasOwnedOpen,
    });
    this.wasOwnedOpen = true;
  }

  private clearUrlState(options: NormalizedUrlStateOptions): void {
    const queryState = this.queryState();
    if (queryState.galleryId !== options.galleryId) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [GALLERY_QUERY_PARAM]: null,
        [ITEM_QUERY_PARAM]: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private runFromUrlState(action: () => void): void {
    this.isApplyingUrlState = true;
    try {
      action();
    } finally {
      this.isApplyingUrlState = false;
    }
  }
}

function getStableItemId(item: NgxImageGalleryItem | null): string | null {
  const id = item?.id?.trim();
  return id ? id : null;
}
