import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideNgxImageGallery } from '@design4pro/ngx-image-gallery';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withViewTransitions(),
    ),
    provideNgxImageGallery({
      provisionalLongEdge: 1600,
      loop: true,
      closeOnEsc: true,
      closeOnBackdrop: true,
      showCounter: true,
    }),
  ],
};
