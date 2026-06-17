import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { HlmSkeletonImports } from '@demo/ui/skeleton';
import type { HighlighterCore } from 'shiki/core';

type CodeLanguage = 'html' | 'ts' | 'css' | 'bash' | 'yaml';

let highlighterPromise: Promise<HighlighterCore> | null = null;

@Component({
  selector: 'app-code-block',
  imports: [HlmSkeletonImports],
  template: `
    <div
      class="overflow-hidden rounded-md border border-zinc-200 bg-zinc-950 shadow-sm shadow-zinc-950/5"
    >
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span class="font-mono text-xs font-medium text-zinc-300">{{ label() }}</span>
        <span
          class="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
        >
          {{ language() }}
        </span>
      </div>

      @if (highlighted()) {
        <div class="code-block-scroll" [innerHTML]="highlighted()"></div>
      } @else {
        <div class="space-y-3 p-4">
          <div hlmSkeleton class="h-4 w-4/5 bg-white/10"></div>
          <div hlmSkeleton class="h-4 w-3/5 bg-white/10"></div>
          <div hlmSkeleton class="h-4 w-2/3 bg-white/10"></div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    .code-block-scroll {
      max-height: 520px;
      min-width: 0;
      overflow: auto;
    }

    .code-block-scroll :where(pre) {
      margin: 0;
      padding: 1rem;
      background: transparent !important;
      font-size: 0.8125rem;
      line-height: 1.7;
    }
  `,
})
export class CodeBlock {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly highlightedHtml = signal<SafeHtml | null>(null);
  private renderId = 0;

  readonly code = input.required<string>();
  readonly language = input.required<CodeLanguage>();
  readonly label = computed(() => this.languageLabel(this.language()));
  readonly highlighted = this.highlightedHtml.asReadonly();

  constructor() {
    effect(() => {
      const code = this.code();
      const language = this.language();
      void this.highlight(code, language);
    });
  }

  private async highlight(code: string, language: CodeLanguage): Promise<void> {
    const currentRender = ++this.renderId;
    this.highlightedHtml.set(null);

    const highlighter = await getHighlighter();
    const html = highlighter.codeToHtml(code, {
      lang: language === 'ts' ? 'typescript' : language,
      theme: 'github-dark-default',
    });

    if (currentRender === this.renderId) {
      this.highlightedHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
    }
  }

  private languageLabel(language: CodeLanguage): string {
    const labels: Record<CodeLanguage, string> = {
      html: 'Template',
      ts: 'TypeScript',
      css: 'CSS',
      bash: 'Shell',
      yaml: 'Workflow',
    };
    return labels[language];
  }
}

async function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/themes/github-dark-default.mjs'),
    import('shiki/langs/html.mjs'),
    import('shiki/langs/typescript.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/yaml.mjs'),
  ]).then(([core, engine, theme, html, typescript, css, bash, yaml]) =>
    core.createHighlighterCore({
      themes: [theme.default],
      langs: [html.default, typescript.default, css.default, bash.default, yaml.default],
      engine: engine.createJavaScriptRegexEngine(),
    }),
  );

  return highlighterPromise;
}
