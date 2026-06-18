import { Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideGithub } from '@ng-icons/lucide';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmButtonImports } from '@demo/ui/button';
import { HlmIconImports } from '@demo/ui/icon';
import { primaryNav } from './shared/docsite/docsite-data';
import { MobileNav } from './shared/mobile-nav/mobile-nav';

@Component({
  selector: 'app-root',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HlmButtonImports,
    HlmIconImports,
    MobileNav,
  ],
  providers: [provideIcons({ lucideArrowRight, lucideGithub })],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('ngx-image-gallery');
  protected readonly primaryNav = primaryNav;
  protected readonly repoUrl = 'https://github.com/design4pro/ngx-image-gallery';
}
