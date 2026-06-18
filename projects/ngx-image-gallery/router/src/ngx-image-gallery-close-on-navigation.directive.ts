import { Directive, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NgxImageGalleryDirective } from 'ngx-image-gallery';

export interface NgxImageGalleryCloseOnNavigationOptions {
  closeOnNavigation?: boolean;
  closeOnHistoryBack?: boolean;
}

interface NormalizedCloseOnNavigationOptions {
  closeOnNavigation: boolean;
  closeOnHistoryBack: boolean;
}

@Directive({
  selector: '[ngxImageGalleryCloseOnNavigation]',
  standalone: true,
})
export class NgxImageGalleryCloseOnNavigationDirective {
  private readonly gallery = inject(NgxImageGalleryDirective, { host: true });
  private readonly router = inject(Router);

  readonly ngxImageGalleryCloseOnNavigation = input<
    NgxImageGalleryCloseOnNavigationOptions | boolean | ''
  >('');

  private readonly options = computed<NormalizedCloseOnNavigationOptions>(() => {
    const value = this.ngxImageGalleryCloseOnNavigation();

    if (value === false) {
      return {
        closeOnNavigation: false,
        closeOnHistoryBack: false,
      };
    }

    if (value === '' || value === true) {
      return {
        closeOnNavigation: true,
        closeOnHistoryBack: true,
      };
    }

    return {
      closeOnNavigation: value.closeOnNavigation ?? true,
      closeOnHistoryBack: value.closeOnHistoryBack ?? true,
    };
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.closeForNavigation(event));
  }

  private closeForNavigation(event: NavigationStart): void {
    if (!this.gallery.ownsActiveLightbox() || !this.shouldCloseForNavigation(event)) {
      return;
    }

    this.gallery.close();
  }

  private shouldCloseForNavigation(event: NavigationStart): boolean {
    const options = this.options();

    return (
      options.closeOnNavigation ||
      (options.closeOnHistoryBack && isHistoryNavigation(event.navigationTrigger))
    );
  }
}

function isHistoryNavigation(trigger: NavigationStart['navigationTrigger']): boolean {
  return trigger === 'popstate' || trigger === 'hashchange';
}
