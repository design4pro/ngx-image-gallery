import { Routes } from '@angular/router';
import { CssPropertiesGalleryExample } from './examples/css-properties-gallery-example';
import { DynamicPoolGalleryExample } from './examples/dynamic-pool-gallery-example';
import { TailwindGalleryExample } from './examples/tailwind-gallery-example';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'custom-properties',
  },
  {
    path: 'custom-properties',
    component: CssPropertiesGalleryExample,
  },
  {
    path: 'tailwind',
    component: TailwindGalleryExample,
  },
  {
    path: 'dynamic-pool',
    component: DynamicPoolGalleryExample,
  },
];
