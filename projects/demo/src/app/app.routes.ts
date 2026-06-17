import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((component) => component.HomePage),
  },
  {
    path: 'examples',
    pathMatch: 'full',
    redirectTo: 'examples/custom-properties',
  },
  {
    path: 'examples/route-sync',
    pathMatch: 'full',
    redirectTo: () => '/examples/router-close',
  },
  {
    path: 'examples/:slug',
    loadComponent: () =>
      import('./pages/examples/examples-page').then((component) => component.ExamplesPage),
  },
  {
    path: 'docs',
    pathMatch: 'full',
    redirectTo: 'docs/installation',
  },
  {
    path: 'docs/route-sync',
    pathMatch: 'full',
    redirectTo: () => '/docs/router-close',
  },
  {
    path: 'docs/:slug',
    loadComponent: () => import('./pages/docs/docs-page').then((component) => component.DocsPage),
  },
  {
    path: 'custom-properties',
    pathMatch: 'full',
    redirectTo: 'examples/custom-properties',
  },
  {
    path: 'tailwind',
    pathMatch: 'full',
    redirectTo: 'examples/tailwind',
  },
  {
    path: 'dynamic-pool',
    pathMatch: 'full',
    redirectTo: 'examples/router-close',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
