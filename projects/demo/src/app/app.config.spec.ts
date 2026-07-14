import { ApplicationRef, type ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

describe('appConfig', () => {
  let appRef: ApplicationRef;
  let rootComponent: ComponentRef<App>;

  beforeEach(async () => {
    document.body.innerHTML = '<app-root></app-root>';

    await TestBed.configureTestingModule({
      providers: appConfig.providers,
    }).compileComponents();

    appRef = TestBed.inject(ApplicationRef);
    rootComponent = appRef.bootstrap(App);
  });

  afterEach(() => {
    rootComponent.destroy();
    document.body.innerHTML = '';
  });

  it('scrolls to the top after navigation between gallery examples', async () => {
    const router = TestBed.inject(Router);
    const viewportScroller = TestBed.inject(ViewportScroller);
    const scrollSpy = vi
      .spyOn(viewportScroller, 'scrollToPosition')
      .mockImplementation(() => undefined);

    await router.navigateByUrl('/examples/custom-properties');
    await waitForScheduledScroll();
    scrollSpy.mockClear();

    await router.navigateByUrl('/examples/tailwind');
    await waitForScheduledScroll();

    expect(scrollSpy).toHaveBeenCalledWith([0, 0]);
  });
});

function waitForScheduledScroll(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
