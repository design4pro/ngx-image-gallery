import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HlmAccordionImports } from '@demo/ui/accordion';
import { HlmBadgeImports } from '@demo/ui/badge';
import { HlmSeparatorImports } from '@demo/ui/separator';
import { HlmTypographyImports } from '@demo/ui/typography';
import { CodeBlock } from '../../shared/code-block/code-block';
import { classHooks, cssTokens, docs, optionGroups } from '../../shared/docsite/docsite-data';

@Component({
  selector: 'app-docs-page',
  imports: [
    RouterLink,
    CodeBlock,
    HlmAccordionImports,
    HlmBadgeImports,
    HlmSeparatorImports,
    HlmTypographyImports,
  ],
  template: `
    <div class="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[220px_1fr] lg:px-6">
      <aside class="hidden lg:block">
        <nav class="sticky top-24 grid gap-1" aria-label="Documentation">
          @for (item of docsNav; track item.slug) {
            <a
              class="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
              [class.bg-zinc-950]="item.slug === doc().slug"
              [class.text-white]="item.slug === doc().slug"
              [routerLink]="['/docs', item.slug]"
            >
              {{ item.title }}
            </a>
          }
        </nav>
      </aside>

      <article class="min-w-0">
        <div class="mb-8 max-w-3xl">
          <span hlmBadge variant="secondary">Docs</span>
          <h1 hlmH1 class="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 lg:text-5xl">
            {{ doc().title }}
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {{ doc().description }}
          </p>
        </div>

        <div class="mb-8 flex gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="Documentation">
          @for (item of docsNav; track item.slug) {
            <a
              class="shrink-0 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700"
              [class.bg-zinc-950]="item.slug === doc().slug"
              [class.text-white]="item.slug === doc().slug"
              [routerLink]="['/docs', item.slug]"
            >
              {{ item.title }}
            </a>
          }
        </div>

        <div class="grid gap-8">
          @for (section of doc().sections; track section.title) {
            <section class="grid gap-4 border-b border-border pb-8">
              <div class="max-w-3xl">
                <h2 hlmH2 class="text-2xl font-semibold tracking-tight text-zinc-950">
                  {{ section.title }}
                </h2>
                <p class="mt-2 leading-7 text-zinc-600">{{ section.body }}</p>
              </div>

              @if (section.code) {
                <app-code-block [language]="section.code.language" [code]="section.code.code" />
              }
            </section>
          }

          @if (doc().slug === 'options') {
            <section class="grid gap-5 border-b border-border pb-8">
              <h2 class="text-2xl font-semibold tracking-tight text-zinc-950">API reference</h2>
              <p class="mt-2 max-w-2xl leading-7 text-zinc-600">
                The public surface stays small and explicit. Route sync lives in a secondary
                entrypoint.
              </p>

              <div hlmAccordion type="multiple" class="mt-6">
                @for (group of optionGroups; track group.title) {
                  <div hlmAccordionItem>
                    <hlm-accordion-trigger>
                      <span>{{ group.title }}</span>
                    </hlm-accordion-trigger>
                    <hlm-accordion-content>
                      <div class="grid gap-3 pb-2">
                        @for (option of group.options; track option.name) {
                          <div class="border-b border-border py-4 last:border-b-0">
                            <div class="flex flex-wrap items-center gap-2">
                              <code class="rounded-md bg-zinc-100 px-2 py-1 font-mono text-sm">
                                {{ option.name }}
                              </code>
                              <span hlmBadge variant="outline">{{ option.type }}</span>
                              <span class="font-mono text-xs text-zinc-500">
                                default {{ option.defaultValue }}
                              </span>
                            </div>
                            <p class="mt-2 text-sm leading-6 text-zinc-600">
                              {{ option.description }}
                            </p>
                          </div>
                        }
                      </div>
                    </hlm-accordion-content>
                  </div>
                }
              </div>
            </section>
          }

          @if (doc().slug === 'styling') {
            <section class="grid gap-5">
              <div>
                <h2 class="text-2xl font-semibold tracking-tight text-zinc-950">Class hooks</h2>
                <p class="mt-2 max-w-2xl leading-7 text-zinc-600">
                  The classes option maps to these generated elements.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (hook of classHooks; track hook) {
                  <span hlmBadge variant="outline">{{ hook }}</span>
                }
              </div>
              <div hlmSeparator></div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-950">CSS custom properties</h3>
                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  @for (token of cssTokens; track token) {
                    <code class="rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-700">
                      {{ token }}
                    </code>
                  }
                </div>
              </div>
            </section>
          }
        </div>
      </article>
    </div>
  `,
})
export class DocsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly docsNav = docs;
  protected readonly optionGroups = optionGroups;
  protected readonly classHooks = classHooks;
  protected readonly cssTokens = cssTokens;
  protected readonly doc = computed(() => {
    const slug = this.params().get('slug') ?? 'installation';
    return docs.find((item) => item.slug === slug) ?? docs[0];
  });
}
