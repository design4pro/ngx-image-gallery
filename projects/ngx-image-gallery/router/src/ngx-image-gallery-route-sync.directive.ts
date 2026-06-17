import {
  AfterContentInit,
  Directive,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NgxImageGalleryDirective,
  NgxImageGalleryService,
  type NgxImageGalleryItem,
} from 'ngx-image-gallery';

export interface NgxImageGalleryRouteSyncOptions {
  queryParam?: string;
  id?: (item: NgxImageGalleryItem, index: number) => string;
  slideNavigation?: 'replace' | 'push';
  closeOnMissingItem?: boolean;
}

interface NormalizedRouteSyncOptions {
  queryParam: string;
  id: (item: NgxImageGalleryItem, index: number) => string;
  slideNavigation: 'replace' | 'push';
  closeOnMissingItem: boolean;
}

@Directive({
  selector: '[ngxImageGalleryRouteSync]',
  standalone: true,
})
export class NgxImageGalleryRouteSyncDirective implements AfterContentInit {
  private readonly gallery = inject(NgxImageGalleryDirective, { host: true });
  private readonly galleryService = inject(NgxImageGalleryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contentReady = signal(false);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private managedOpen = false;

  readonly ngxImageGalleryRouteSync = input<NgxImageGalleryRouteSyncOptions | ''>('');

  private readonly options = computed<NormalizedRouteSyncOptions>(() => {
    const options = this.ngxImageGalleryRouteSync();
    const value = typeof options === 'object' ? options : {};

    return {
      queryParam: value.queryParam ?? 'image',
      id: value.id ?? defaultRouteSyncId,
      slideNavigation: value.slideNavigation ?? 'replace',
      closeOnMissingItem: value.closeOnMissingItem ?? true,
    };
  });

  constructor() {
    effect(() => {
      if (!this.contentReady()) {
        return;
      }

      const routeValue = this.queryParamMap().get(this.options().queryParam);
      this.applyRouteValue(routeValue, this.options());
    });

    effect(() => {
      if (!this.contentReady()) {
        return;
      }

      const state = this.galleryService.state();
      this.applyGalleryState(state.isOpen, state.activeIndex, this.options());
    });
  }

  ngAfterContentInit(): void {
    this.contentReady.set(true);
  }

  private applyRouteValue(routeValue: string | null, options: NormalizedRouteSyncOptions): void {
    if (!routeValue) {
      if (this.managedOpen || this.gallery.ownsActiveLightbox()) {
        this.gallery.close();
      }
      return;
    }

    const index = this.findIndexByRouteValue(routeValue, options);
    if (index < 0) {
      if (options.closeOnMissingItem && this.gallery.ownsActiveLightbox()) {
        this.gallery.close();
      }
      if (options.closeOnMissingItem) {
        this.updateRouteParam(null, options);
      }
      return;
    }

    if (this.gallery.ownsActiveLightbox()) {
      if (this.galleryService.activeIndex() !== index) {
        this.galleryService.goTo(index);
      }
      return;
    }

    this.managedOpen = true;
    this.gallery.open(index);
  }

  private applyGalleryState(
    isOpen: boolean,
    activeIndex: number,
    options: NormalizedRouteSyncOptions,
  ): void {
    if (isOpen && this.gallery.ownsActiveLightbox()) {
      this.managedOpen = true;
      const activeRouteValue = this.getRouteValue(activeIndex, options);
      if (activeRouteValue) {
        this.updateRouteParam(activeRouteValue, options);
      }
      return;
    }

    if (this.managedOpen && !isOpen) {
      this.managedOpen = false;
      this.updateRouteParam(null, options);
    }
  }

  private findIndexByRouteValue(routeValue: string, options: NormalizedRouteSyncOptions): number {
    return this.gallery
      .getItems()
      .findIndex((item, index) => options.id(item, index) === routeValue);
  }

  private getRouteValue(index: number, options: NormalizedRouteSyncOptions): string | null {
    const item = this.gallery.getItems()[index];
    return item ? options.id(item, index) : null;
  }

  private updateRouteParam(value: string | null, options: NormalizedRouteSyncOptions): void {
    const current = this.route.snapshot.queryParamMap.get(options.queryParam);
    if (current === value) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [options.queryParam]: value,
      },
      queryParamsHandling: 'merge',
      replaceUrl: options.slideNavigation !== 'push',
    });
  }
}

function defaultRouteSyncId(item: NgxImageGalleryItem, index: number): string {
  return item.id ?? String(index);
}
