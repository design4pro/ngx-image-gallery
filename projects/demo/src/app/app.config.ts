import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNgxImageGallery } from 'ngx-image-gallery';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideNgxImageGallery({
      provisionalLongEdge: 1600,
      loop: true,
      closeOnEsc: true,
      closeOnBackdrop: true,
      showCounter: true,
    }),
  ],
};
