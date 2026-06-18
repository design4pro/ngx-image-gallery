import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import type { NgxImageGalleryItemContentContext } from './gallery-types';
import { NgxImageGalleryItemDirective } from './ngx-image-gallery-item.directive';

@Directive({
  selector: 'ng-template[ngxImageGalleryItemContent]',
  standalone: true,
})
export class NgxImageGalleryItemContentDirective implements OnInit, OnDestroy {
  readonly templateRef = inject<TemplateRef<NgxImageGalleryItemContentContext>>(TemplateRef);
  readonly viewContainerRef = inject(ViewContainerRef);

  private readonly parentItem = inject(NgxImageGalleryItemDirective, {
    optional: true,
  });

  ngOnInit(): void {
    this.parentItem?.registerContent({
      templateRef: this.templateRef,
      viewContainerRef: this.viewContainerRef,
    });
  }

  ngOnDestroy(): void {
    this.parentItem?.unregisterContent(this.templateRef);
  }

  static ngTemplateContextGuard(
    _directive: NgxImageGalleryItemContentDirective,
    context: unknown,
  ): context is NgxImageGalleryItemContentContext {
    return true;
  }
}
