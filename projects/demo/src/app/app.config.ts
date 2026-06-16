import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgxImageGallery } from 'ngx-image-gallery';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNgxImageGallery({
      provisionalLongEdge: 1600,
      loop: true,
      closeOnEsc: true,
      closeOnBackdrop: true,
      showCounter: true,
    }),
  ],
};
