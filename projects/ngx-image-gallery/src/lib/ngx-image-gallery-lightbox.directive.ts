import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import type { NgxImageGalleryLightboxContext } from './gallery-types';
import { NgxImageGalleryDirective } from './ngx-image-gallery.directive';

@Directive({
  selector: 'ng-template[ngxImageGalleryLightbox]',
  standalone: true,
})
export class NgxImageGalleryLightboxDirective implements OnInit, OnDestroy {
  readonly templateRef = inject<TemplateRef<NgxImageGalleryLightboxContext>>(TemplateRef);
  readonly viewContainerRef = inject(ViewContainerRef);

  private readonly parentGallery = inject(NgxImageGalleryDirective, {
    host: true,
    optional: true,
  });

  ngOnInit(): void {
    this.parentGallery?.registerLightbox(this);
  }

  ngOnDestroy(): void {
    this.parentGallery?.unregisterLightbox(this);
  }

  static ngTemplateContextGuard(
    _directive: NgxImageGalleryLightboxDirective,
    context: unknown,
  ): context is NgxImageGalleryLightboxContext {
    return true;
  }
}
