import { Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideMenu } from '@ng-icons/lucide';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@demo/ui/badge';
import { HlmButtonImports } from '@demo/ui/button';
import { HlmIconImports } from '@demo/ui/icon';
import { HlmSeparatorImports } from '@demo/ui/separator';
import { HlmSheetImports } from '@demo/ui/sheet';
import { docs, primaryNav } from '../docsite/docsite-data';

@Component({
  selector: 'app-mobile-nav',
  imports: [
    RouterLink,
    HlmBadgeImports,
    HlmButtonImports,
    HlmIconImports,
    HlmSeparatorImports,
    HlmSheetImports,
  ],
  providers: [provideIcons({ lucideMenu })],
  template: `
    <hlm-sheet>
      <button
        hlmBtn
        hlmSheetTrigger
        side="right"
        variant="outline"
        size="icon-sm"
        aria-label="Open navigation"
      >
        <ng-icon hlm size="sm" name="lucideMenu" />
      </button>

      <ng-template hlmSheetPortal>
        <hlm-sheet-content class="w-[min(88vw,22rem)]">
          <hlm-sheet-header>
            <h2 hlmSheetTitle>{{ title() }}</h2>
          </hlm-sheet-header>

          <div class="grid gap-6 px-4 pb-6">
            <div class="grid gap-2">
              <span hlmBadge variant="outline" class="w-fit">Navigation</span>
              @for (item of primaryNav; track item.path) {
                <button
                  hlmBtn
                  hlmSheetClose
                  variant="ghost"
                  class="justify-start"
                  [routerLink]="item.path"
                >
                  {{ item.label }}
                </button>
              }
            </div>

            <hlm-separator decorative />

            <div class="grid gap-2">
              <span hlmBadge variant="outline" class="w-fit">Docs</span>
              @for (item of docsNav; track item.path) {
                <button
                  hlmBtn
                  hlmSheetClose
                  variant="ghost"
                  class="justify-start"
                  [routerLink]="item.path"
                >
                  {{ item.label }}
                </button>
              }
            </div>
          </div>
        </hlm-sheet-content>
      </ng-template>
    </hlm-sheet>
  `,
})
export class MobileNav {
  protected readonly title = signal('ngx-image-gallery');
  protected readonly primaryNav = primaryNav;
  protected readonly docsNav = docs.map((page) => ({
    label: page.title,
    path: `/docs/${page.slug}`,
  }));
}
