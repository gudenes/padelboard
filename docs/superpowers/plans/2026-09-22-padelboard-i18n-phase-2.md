# Padelboard i18n — Fase 2 (superfícies públicas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair para chaves toda a copy que um visitante anónimo vê (`/`, `/manifesto`, `/help`, e o wizard de criação de board), traduzi-la para pt-BR, italiano e espanhol, e ligar o `hreflang` — deixando `/pt`, `/it` e `/es` genuinamente navegáveis.

**Architecture:** Extração primeiro, tradução depois. As Tasks 1–7 movem ~380 strings inglesas para `src/messages/en.json` mantendo a app idêntica e a funcionar; só as Tasks 8–10 escrevem pt/it/es. É a mesma disciplina da Fase 1: se a extração partir alguma coisa, descobre-se com a app ainda em inglês e revertível, não com 1140 unidades traduzidas por cima. O teste de paridade de chaves da Fase 1 protege cada passo.

**Tech Stack:** next-intl 4.14.6, Next.js 16.3.5 (App Router), React 19, TypeScript 5.5, vitest 4, Cloudflare Workers via `@opennextjs/cloudflare`.

**Spec:** [`docs/superpowers/specs/2026-09-22-padelboard-i18n-design.md`](../specs/2026-09-22-padelboard-i18n-design.md)
**Fase anterior:** [`2026-09-22-padelboard-i18n-phase-1.md`](2026-09-22-padelboard-i18n-phase-1.md) — concluída e verificada em workerd.

**Repo e branch:** `/Users/GuDenes/Documents/ChatGPT/PadelLabs/padelboard`, branch `claude`.

---

## Âmbito desta fase

### Dentro

| Superfície | Ficheiros | Strings |
|---|---|---|
| Chrome partilhado | `PublicHeader`, `ProjectFooter`, `FeedbackButton` | ~35 |
| Home — marketing | `PlayfulHome` (hero, features, how-it-works, examples, FAQ) | ~60 |
| Home — wizard | `PlayfulHome` (passos 1–3, play stage, go-live), `HeroScoreDemo` | ~95 |
| Wizard — sub-componentes | `FinishSetup`, `BrandBoardGenerator`, `CustomBoardEditor`, `LogoPicker`, `SignIn` | ~100 |
| Help | `help/page.tsx`, `HelpGuides` | ~85 |
| Dados constantes | `board-styles.ts` (notes), `padel-scoring.ts` (DEUCE_RULES) | ~13 |
| SEO | `metadata` por página + `hreflang` | — |

Total ≈ **380 strings** × 3 línguas ≈ **1140 unidades de tradução**.

### Fora, e porquê

| Item | Razão |
|---|---|
| `TourScoreboard.tsx` | Renderizada para o output do OBS via `src/lib/templates/tour.tsx`, fora do ciclo de pedido. A língua vem de `matches.overlay.locale`, não do URL. **Fase 4.** |
| `scoreboard-labels.ts`, `StatusBadges.tsx` | Terminologia de placar (`BREAK POINT`, `SUPER-TIEBREAK`, `AD`). O spec §3 exige uma lista validada com o Gustavo e um teste de orçamento de caracteres antes de entrar em código. **Fase 4.** |
| Dashboard, workspace, operador, erros de API | **Fase 3.** |
| `FinishSetup` ramo `editProfile` | Só alcançável autenticado (`/dashboard/profile`). Extrai-se a chave (o ficheiro é tocado de qualquer forma), mas não é superfície pública. |

### Três decisões tomadas antes deste plano

**1. O wizard da home entra nesta fase.** O spec §8 põe "wizard" na Fase 3, mas a Fase 3 chama-se *"app autenticada"* — e este wizard é usável **sem conta** (`src/app/[locale]/page.tsx:10` monta a `PlayfulHome` sem qualquer guard). Pela lógica do próprio spec é superfície pública. Deixá-lo em inglês tornaria `/pt` uma página traduzida que passa a inglês ao primeiro clique.

**2. Os labels de UI citados no `/help` ficam em inglês.** O `HelpGuides` cita ~40 controlos concretos (`Start camera`, `Copy overlay link`, `Focus mode`, `Match options → End match`). Esses controlos vivem no workspace, que só é traduzido na Fase 3. Traduzir o label dentro do `<b>` enquanto o botão real continua inglês produz instruções impossíveis de seguir. **A prosa é traduzida; o conteúdo dos `<b>` que nomeia um controlo mantém-se em inglês.** Na Fase 3 os dois mudam juntos.

**3. `TourScoreboard` fica intacta.** Ver tabela acima.

### Dois factos que limitam expectativas

- **Os screenshots do `/help` são só em inglês** (`/images/guides/*.png`, referenciados em `HelpGuides.tsx:210,237,271,362`). O texto traduzido vai descrever imagens inglesas. Não se resolve nesta fase; é trabalho de design.
- **Estes componentes são partilhados com a app autenticada.** `FinishSetup` é usado em `welcome/page.tsx:37` e `dashboard/profile/page.tsx:23`; `CustomBoardEditor` em `ScoreboardEditor.tsx:151` e `StepTemplate.tsx:42`. Traduzi-los aqui adianta parte da Fase 3 — é ganho, não problema, mas explica porque a contagem é maior do que "três páginas públicas" sugere.

---

## Namespaces

Espelham o spec §4. Um namespace por área, para que a Fase 3 acrescente sem reorganizar:

```
metadata     já existe (Fase 1) — ganha title/description por página
manifesto    já existe (Fase 1)
common       chrome partilhado: header, footer, feedback
home         marketing da landing
wizard       passos de criação de board (players, look, rules, play, go-live)
boardEditor  BrandBoardGenerator, CustomBoardEditor, LogoPicker
account      FinishSetup, SignIn
help         página de ajuda
boardStyles  notes de board-styles.ts
rules        labels/descrições de DEUCE_RULES
```

---

## Regras de tradução

Estas regras valem para as Tasks 8–10 e não se negoceiam por string.

### Nunca traduzir

- **Marcas:** `Padelboard`, `Padel Labs`, `OBS`, `OBS Studio`, `StreamYard`, `vMix`, `YouTube`, `OpenAI`, `Premier`, `FIP`, `APT`, `Roland-Garros`.
- **Golpes de padel** (spec §3, glossário invariante): `bandeja`, `víbora`, `bajada`, `chiquita`, `contrapared`. Não ocorrem hoje no código; a regra é prospetiva.
- **Chaves persistidas.** São valores guardados na base de dados e usados como discriminantes. Traduzir qualquer um destes corrompe dados:
  - `board-styles.ts:4,13,22,31,40,49` → `padelboard`, `tour-premier`, `tour-fip`, `tour-apt`, `tour-clay`, `custom`
  - `padel-scoring.ts:15,20,25` → `star-point`, `golden-point`, `advantage`
  - `FeedbackButton.tsx:116-118` → `value="idea" | "problem" | "other"`
  - `FinishSetup.tsx:184-187` → `value="player" | "club" | "organizer" | "federation"`
  - `CustomBoardEditor.tsx:89-99,217-229` → os `key` das duas const arrays
  - `CustomBoardEditor.tsx:210-212` → `value="sans" | "serif" | "mono"`
- **Nomes de jogadores de demo:** `Galán`, `Chingotto`, `Coello`, `Tapia`, `Alex`, `Sam`, `Dani`, `Nico`.
- **Teclas e valores literais:** `Esc`, `OK`, `1920`, `1080`, `Transparent`, `/overlay/`, `#173f37`, `#f5ff36`.
- **Labels de UI do OBS:** `Sources`, `Browser`, `Browser Source`, `Local file`, `URL`, `Game Capture`, `Transform → Fit to Screen`, `Start Streaming`, `Start Recording`, `Refresh cache of current page`.
- **Labels de UI do Padelboard citados no `/help`** — ver decisão 2 acima.
- **Glifos decorativos:** `✳ ↗ ▣ ✓ → ↓ × ✎ ·`. Ficam no `.tsx`, fora da mensagem. Uma seta dentro do valor traduzido fica errada em RTL e duplica-se.

### Traduzir com cuidado

- **`Star Point`** — nome de funcionalidade do Padelboard (`padel-scoring.ts:16`, comentário em `:34`). Mantém-se em inglês, como marca de produto. `Golden point` e `Advantage` são termos canónicos do desporto e **traduzem-se** (`punto de oro`, `ventaja`, `punto de ouro`, `vantagem`).
- **Trocadilhos.** `Game. Set. Stream.` (`HelpGuides.tsx:386`), `You've made your point!` (`FeedbackButton.tsx:92`), `Help us up our game.` (`:107`), `Something not playing ball?` (`HelpGuides.tsx:396`). Transcriação, não tradução literal. Um trocadilho traduzido à letra é pior que uma frase simples.
- **Quebras de linha.** As chaves com `<br></br>` têm a quebra escolhida tipograficamente para inglês. **Cada língua reposiciona a sua.** Não se copia a posição inglesa.
- **`2,000`** (`FeedbackButton.tsx:134`) — separador de milhares inglês, hardcoded. Ver Task 2, Step 6.

### Variante de português

pt-BR, conforme spec. `você`, não `tu`. `time`/`dupla`, não `equipa`. `tela`, não `ecrã`. `celular`, não `telemóvel`.

---

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
|---|---|
| `src/i18n/routing.ts` | Já existe. `hreflangByLocale` deixa de ser código morto na Task 1 |
| `src/lib/seo.ts` | **Novo.** Constrói `alternates.languages` para uma rota, a partir de `hreflangByLocale` |
| `src/lib/__tests__/seo.test.ts` | **Novo.** Tranca o contrato do hreflang |
| `src/messages/{en,pt,it,es}.json` | Crescem de 2 para 11 namespaces |
| `src/lib/__tests__/i18n-messages.test.ts` | Já existe. Ganha um teste de placeholders na Task 8 |
| `src/lib/__tests__/i18n-no-hardcoded-links.test.ts` | **Novo.** Falha se uma rota `[locale]` importar `Link` de `next/link` |

---

### Task 1: hreflang e metadata por página

O `hreflangByLocale` foi criado na Fase 1 e nunca foi ligado a nada — hoje só o seu próprio teste lhe toca. Sem ele, o `localePrefix: 'as-needed'` que motivou todo o desenho não produz SEO nenhum.

**Files:**
- Create: `src/lib/seo.ts`
- Test: `src/lib/__tests__/seo.test.ts`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/__tests__/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { localeAlternates } from '@/lib/seo'

describe('localeAlternates', () => {
  it('mapeia cada locale para o seu hreflang, com o inglês sem prefixo', () => {
    expect(localeAlternates('/manifesto')).toEqual({
      en: '/manifesto',
      'pt-BR': '/pt/manifesto',
      it: '/it/manifesto',
      es: '/es/manifesto',
    })
  })

  it('trata a raiz sem barra dupla', () => {
    expect(localeAlternates('/')).toEqual({
      en: '/',
      'pt-BR': '/pt',
      it: '/it',
      es: '/es',
    })
  })
})
```

- [ ] **Step 2: Correr o teste para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/seo.test.ts`
Esperado: FAIL — `Cannot find module '@/lib/seo'`.

- [ ] **Step 3: Implementar**

Create `src/lib/seo.ts`:

```ts
import { hreflangByLocale, locales, routing } from '@/i18n/routing'

/**
 * Constrói o mapa `alternates.languages` do Next para uma rota.
 * O inglês é o default e não leva prefixo; as restantes levam.
 * O tipo do parâmetro obriga à barra inicial: `localeAlternates('help')`
 * produziria `/pthelp` em silêncio.
 */
export function localeAlternates(pathname: `/${string}`): Record<string, string> {
  const path = pathname === '/' ? '' : pathname
  const defaultPath = path || '/'

  return {
    ...Object.fromEntries(
      locales.map((locale) => [
        hreflangByLocale[locale],
        locale === routing.defaultLocale ? defaultPath : `/${locale}${path}`,
      ]),
    ),
    // Sinal para línguas que não são nenhuma das quatro.
    'x-default': defaultPath,
  }
}
```

- [ ] **Step 4: Correr o teste**

Run: `npx vitest run src/lib/__tests__/seo.test.ts`
Esperado: PASS — 2 testes.

- [ ] **Step 5: Pôr o `metadataBase` no layout — e só isso**

Sem `metadataBase`, o Next emite os `href` tal como lhe são dados, e um `hreflang` relativo é **ignorado pelos motores de busca**. Não há `metadataBase` nenhum no projeto hoje, por isso esta linha é o que faz a task valer alguma coisa. O deploy é Cloudflare Workers, portanto os fallbacks de `VERCEL_URL` não salvam o caso.

Modify `src/app/[locale]/layout.tsx` — na `generateMetadata`:

```tsx
import { localeAlternates } from "@/lib/seo";
// …
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://padelboard.padellabs.tech",
    ),
    title: t("title"),
    description: t("description"),
  };
```

> **O layout não declara `alternates`.** O `alternates` é herdado por todas as
> páginas-filhas; se o layout fixar `localeAlternates("/")`, cada rota passa a
> declarar que a sua tradução é a *homepage* — pior do que não ter hreflang
> nenhum, porque diz ao crawler uma falsidade. Cada página indexável declara o
> seu. As não indexáveis (`/login`, `/welcome`, `/dashboard`, `/m/*`) ficam
> corretamente sem hreflang.

- [ ] **Step 5b: Declarar os alternates página a página**

`src/app/[locale]/page.tsx` não tem `generateMetadata` nenhuma. Acrescenta uma, seguindo o padrão que já existe em `manifesto/page.tsx`:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { languages: localeAlternates("/") },
  };
}
```

E em `src/app/[locale]/manifesto/page.tsx`, acrescenta ao objeto que a `generateMetadata` já devolve:

```tsx
    alternates: { languages: localeAlternates("/manifesto") },
```

O `/help` recebe o seu na Task 7. **Qualquer página indexável acrescentada daqui para a frente tem de declarar o seu** — não há herança que o faça bem.

- [ ] **Step 6: Verificar no browser**

Run: `npm run dev`

```bash
curl -s http://localhost:3003/ | grep -io '<link rel="alternate" hreflang="[^"]*" href="[^"]*"'
```

Esperado: quatro linhas, uma por língua, com `hreflang="pt-BR"` a apontar para `/pt`.

> O `-i` é obrigatório: o React emite o atributo como `hrefLang` (camelCase). Um grep
> case-sensitive devolve vazio e parece uma falha quando está tudo bem.

- [ ] **Step 7: Commit**

```bash
git add src/lib/seo.ts src/lib/__tests__/seo.test.ts 'src/app/[locale]/layout.tsx'
git commit -m "feat(i18n): wire hreflang alternates into page metadata"
```

---

### Task 2: Chrome partilhado — header, footer, feedback

Estes três renderizam em **todas** as páginas via o layout do locale. Extraí-los primeiro significa que qualquer página que se traduza a seguir já tem moldura traduzida.

**Files:**
- Modify: `src/components/home/PublicHeader.tsx`, `src/components/workspace/ProjectFooter.tsx`, `src/components/feedback/FeedbackButton.tsx`
- Modify: `src/messages/{en,pt,it,es}.json`
- Test: `src/lib/__tests__/i18n-no-hardcoded-links.test.ts`

- [ ] **Step 1: Acrescentar o namespace `common` ao `en.json`**

```json
"common": {
  "navHome": "Home",
  "navManifesto": "Our manifesto",
  "navHelp": "Help & guides",
  "navMatches": "My matches",
  "navSignIn": "Sign in",
  "navHomeAria": "Padelboard home",
  "navMainAria": "Main navigation",
  "navFooterAria": "Footer navigation",
  "footerAboutAria": "About Padelboard",
  "footerTagline": "Made for the love of the game.",
  "footerProjectBy": "A project by",
  "feedbackTrigger": "Feedback",
  "feedbackCloseAria": "Close feedback",
  "feedbackThanksTitle": "You’ve made your point!",
  "feedbackThanksBody": "Thanks for helping make Padelboard better. Your feedback has been saved.",
  "feedbackBackToGame": "Back to the game",
  "feedbackEyebrow": "YOUR COURT. YOUR SAY.",
  "feedbackTitle": "Help us up our game.",
  "feedbackLead": "An idea, a hiccup, or something you love? We’re listening.",
  "feedbackCategoryLabel": "What’s on your mind?",
  "feedbackCategoryIdea": "An idea or suggestion",
  "feedbackCategoryProblem": "Something isn’t working",
  "feedbackCategoryOther": "Something else",
  "feedbackMessageLabel": "Your feedback",
  "feedbackPlaceholder": "Tell us a little more…",
  "feedbackCounter": "{count}/{max} · Your account and current page are included. Please don’t include passwords or sensitive information.",
  "feedbackSending": "Sending…",
  "feedbackSubmit": "Send feedback",
  "feedbackErrorSend": "Couldn’t send feedback.",
  "feedbackErrorRetry": "Couldn’t send feedback. Please retry."
}
```

Copia o bloco inglês tal e qual para `pt.json`, `it.json` e `es.json`. A tradução é a Task 8.

- [ ] **Step 2: Converter o `PublicHeader`**

`PublicHeader.tsx` não tem `'use client'`, mas é importado pela `PlayfulHome`, que é cliente — por isso renderiza nos dois contextos. Usa-se `useTranslations()`, que funciona em ambos; `getTranslations()` (async) partiria no cliente.

Modify `src/components/home/PublicHeader.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
```

Troca cada literal por `t("navManifesto")`, `t("navHelp")`, `t("navMatches")`, `t("navSignIn")`, e os `aria-label` por `t("navHomeAria")` / `t("navMainAria")`.

O `→` da linha 15 fica no `.tsx`, fora da mensagem:

```tsx
{t("navSignIn")} <span aria-hidden="true">→</span>
```

Deixa intacto o wordmark `padelboard` e o `<sup>6</sup><span>/</span><sub>4</sub>`.

- [ ] **Step 3: Converter o `ProjectFooter`**

`ProjectFooter.tsx` é `'use client'`. Troca o import `next/link` por `@/i18n/navigation` e os literais por `t("footerTagline")`, `t("footerProjectBy")`, `t("navManifesto")`, `t("navHelp")`, `t("footerAboutAria")`, `t("navFooterAria")`.

**Não toques na linha 8.** O guard `path.startsWith("/overlay/")` continua correto: o `/overlay/*` está excluído do matcher em `src/proxy.ts:13` e fica fora do `[locale]`, por isso nunca recebe prefixo — e o layout do overlay nem sequer renderiza este componente.

A marca `padel labs` na linha 27 **não** se traduz.

- [ ] **Step 4: Converter o `FeedbackButton`**

`'use client'`. Troca os literais pelas chaves `feedback*`. Os dois literais de erro em `:47` e `:55` estão dentro de `throw new Error(...)`, fora do JSX — fáceis de esquecer.

Os `value=` dos `<option>` (`idea`, `problem`, `other`) ficam como estão; só o texto visível muda.

- [ ] **Step 5: Corrigir o contador de caracteres**

A linha 134 tem `2,000` hardcoded com separador de milhares inglês — errado em pt/it/es (`2.000`). Passa a interpolação com formatação por locale:

```tsx
const fmt = useFormatter();
// …
{t("feedbackCounter", {
  count: fmt.number(message.length),
  max: fmt.number(2000),
})}
```

Import: `import { useFormatter, useTranslations } from "next-intl";`

- [ ] **Step 6: Escrever o teste que tranca os links**

Create `src/lib/__tests__/i18n-no-hardcoded-links.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Todos os .tsx sob um directório, recursivamente. */
function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return tsxFiles(full)
    return full.endsWith('.tsx') ? [full] : []
  })
}

describe('links com consciência de locale', () => {
  it('nenhuma rota sob [locale] importa Link de next/link', () => {
    const offenders = tsxFiles('src/app/[locale]')
      .filter((f) => /from ["']next\/link["']/.test(readFileSync(f, 'utf8')))

    expect(offenders).toEqual([])
  })

  it('o chrome partilhado usa o Link do next-intl', () => {
    for (const f of [
      'src/components/workspace/ProjectFooter.tsx',
      'src/components/home/PublicHeader.tsx',
    ]) {
      expect(readFileSync(f, 'utf8')).not.toMatch(/from ["']next\/link["']/)
    }
  })
})
```

- [ ] **Step 7: Correr os testes**

Run: `npx vitest run src/lib/__tests__/`
Esperado: PASS, incluindo paridade de chaves e o novo teste de links.

Se o teste de links falhar, os ficheiros listados ainda importam `next/link` — troca para `@/i18n/navigation`.

- [ ] **Step 8: Verificar no browser**

```bash
curl -s http://localhost:3003/it/manifesto | grep -o 'href="/it/[a-z]*"' | sort -u
```

Esperado: os links do footer (`/it/manifesto`, `/it/help`) com prefixo.

- [ ] **Step 9: Commit**

```bash
git add src/components src/messages src/lib/__tests__/i18n-no-hardcoded-links.test.ts
git commit -m "feat(i18n): extract shared chrome copy and lock locale-aware links"
```

---

### Task 3: Dados constantes — board styles e regras de deuce

Duas const arrays tipadas com copy lá dentro. O padrão: **o `id` fica, o texto sai**. O `id` é a chave de tradução e continua a ser o que vai para a base de dados.

**Files:**
- Modify: `src/lib/board-styles.ts`, `src/lib/padel-scoring.ts`
- Modify: `src/messages/*.json`

- [ ] **Step 1: Acrescentar os namespaces ao `en.json`**

```json
"boardStyles": {
  "padelboard": "Bold & playful",
  "tour-premier": "Premier Padel inspired",
  "tour-fip": "FIP circuit inspired",
  "tour-apt": "APT tour inspired",
  "tour-clay": "Paris clay inspired",
  "custom": "Build your own",
  "customName": "Custom"
},
"rules": {
  "star-point": "Star Point",
  "star-pointDescription": "Two advantages, then one deciding point.",
  "golden-point": "Golden point",
  "golden-pointDescription": "At 40–40, the next point wins.",
  "advantage": "Advantage",
  "advantageDescription": "Keep playing until a pair wins two in a row."
}
```

Copia para as outras três línguas.

- [ ] **Step 2: Remover o `note` da const de board styles**

Modify `src/lib/board-styles.ts` — apaga o campo `note` de cada um dos 6 objetos. **Não toques nos `id` nem nas cores.** O `name` também fica: `Premier`, `FIP`, `APT`, `Roland-Garros` e `Padelboard` são marcas. A exceção é `Custom` (linha 50), cujo texto passa a `boardStyles.customName`.

Nos sítios de consumo (`PlayfulHome.tsx:434,773,811,816,1146`), o `note` passa a `t(style.id)` com `useTranslations("boardStyles")`.

- [ ] **Step 3: Remover `label` e `description` de `DEUCE_RULES`**

Modify `src/lib/padel-scoring.ts` — `DEUCE_RULES` passa a só `id`:

```ts
export const DEUCE_RULES: Array<{ id: DeuceRule }> = [
  { id: "star-point" },
  { id: "golden-point" },
  { id: "advantage" },
];
```

Nos consumos (`PlayfulHome.tsx:994,995,1095`), usa `t(rule.id)` e `t(`${rule.id}Description`)` com `useTranslations("rules")`.

- [ ] **Step 4: Verificar que compila e que os testes passam**

Run: `npx tsc --noEmit && npm test`
Esperado: sem erros. Se `padel-scoring.test.ts` falhar por causa do `label` removido, ajusta o teste — a lógica de pontuação não muda, só o sítio onde vive o texto.

- [ ] **Step 5: Commit**

```bash
git add src/lib/board-styles.ts src/lib/padel-scoring.ts src/messages src/components
git commit -m "feat(i18n): move board style and deuce rule copy into messages"
```

---

### Task 4: Home — copy de marketing

A `PlayfulHome` tem 1179 linhas. Divide-se em duas tasks: esta trata do marketing (hero, features, how-it-works, examples, FAQ, tagline), a Task 5 trata do wizard.

**Files:**
- Modify: `src/components/home/PlayfulHome.tsx` (linhas ~249–506)
- Modify: `src/messages/*.json`

- [ ] **Step 1: Definir o mapa de tags rich uma vez**

No topo do componente, o mesmo padrão validado no manifesto da Fase 1:

```tsx
const richTags = {
  br: () => <br />,
  brDesktop: () => <br className="pb-desktop-break" />,
  b: (chunks: React.ReactNode) => <b>{chunks}</b>,
  hl: (chunks: React.ReactNode) => <span>{chunks}</span>,
};
```

O `brDesktop` existe porque `PlayfulHome.tsx:267-271` usa `<br className="pb-desktop-break" />` — quebras responsivas que o tradutor tem de poder reposicionar.

- [ ] **Step 2: Acrescentar o namespace `home` ao `en.json`**

Chaves nomeadas pelo **papel**, não pelo conteúdo, para que traduzir não obrigue a renomear:

```json
"home": {
  "heroScribble": "STREAM<br></br>MORE PADEL.",
  "heroTitle": "Professional<br></br>scoreboards.<br></br>In seconds.",
  "heroLead": "Create beautiful, real-time padel scoreboards<brDesktop></brDesktop> for OBS, StreamYard or your favorite streaming<brDesktop></brDesktop> software. No account needed to try.",
  "heroCta": "Create your board",
  "heroFree": "FREE.<br></br>NO FUSS.<br></br>JUST PLAY.",
  "heroBoardAria": "Example of a Padelboard scoreboard",
  "heroLooksGreat": "LOOKS GREAT<br></br>ON STREAM.",
  "heroMakeItYours": "Make it yours",
  "featuresAria": "Features",
  "featureScoringTitle": "Real-time scoring",
  "featureScoringBody": "Tap a point. Your stream keeps up.",
  "featureStreamTitle": "Stream ready",
  "featureStreamBody": "Works with OBS, StreamYard, vMix and more.",
  "featureYoursTitle": "Make it yours",
  "featureYoursBody": "Your players, your colors, your match.",
  "featureNoInstallTitle": "No installation",
  "featureNoInstallBody": "One browser. All you need to get going.",
  "tagline": "SCORE <b>·</b> STREAM <b>·</b> PADEL",
  "stepsEyebrow": "LESS SETUP. MORE MATCH.",
  "stepsTitle": "Ready before the warm-up.",
  "stepOneTitle": "Make it your match.",
  "stepOneBody": "Add your players, choose a color, and set the rules. See your board change as you go.",
  "stepTwoTitle": "Give it a quick rally.",
  "stepTwoBody": "Try the scoring controls for free. Golden point, deuce, and tiebreaks are taken care of.",
  "stepThreeTitle": "Take it to your stream.",
  "stepThreeBody": "Sign in to publish, copy your overlay link, and add it as a browser source. You’re on.",
  "examplesEyebrow": "YOUR CLUB. YOUR COLORS.",
  "examplesTitle": "A little more <br></br>you. A lot more <br></br>match day.",
  "examplesLead": "From the Friday-night friendly to the club final.<br></br>There’s a board with your name on it.",
  "examplesUseLook": "Use this look",
  "examplesTemplateAria": "Example scoreboard template",
  "examplesColorAria": "Example scoreboard color",
  "examplesColorsTitle": "Make it your colors.",
  "faqEyebrow": "GOOD QUESTION.",
  "faqTitle": "A few things<br></br>before first serve.",
  "faqAccountQ": "Do I need an account?",
  "faqAccountA": "You can customize a board and try the scoring controls without an account. Sign in when you’re ready to publish a live board and share its overlay.",
  "faqStreamQ": "How does it work with my stream?",
  "faqStreamA": "Once your board is published, add its overlay URL as a browser source in your streaming software. Control the match from your browser while the overlay shows the score.",
  "faqScoringQ": "Does it understand padel scoring?",
  "faqScoringA": "Yes. Star Point, golden point, advantage, set tiebreaks, and a deciding super-tiebreak are built in. Choose your match format during setup.",
  "faqUndoQ": "Can I fix an accidental point?",
  "faqUndoA": "Of course. Tap Undo to go back a point. Try it in the preview — no pressure."
}
```

Copia para as outras três línguas.

- [ ] **Step 3: Corrigir as `key` dependentes da língua**

`PlayfulHome.tsx:341`, `:373` e `:497` usam o título inglês como `key` do React (`key={heading}`, `key={step.title}`, `key={item.q}`). Depois da tradução a key muda com a língua, o que força remontagens desnecessárias.

Dá a cada array um `id` estável e usa-o:

```tsx
{[
  { id: "scoring", Icon: Lightning },
  { id: "stream", Icon: Monitor },
  { id: "yours", Icon: Palette },
  { id: "noInstall", Icon: ShareNetwork },
].map(({ id, Icon }) => (
  <article key={id}>
    <Icon />
    <h3>{t(`feature${id[0].toUpperCase()}${id.slice(1)}Title`)}</h3>
    <p>{t(`feature${id[0].toUpperCase()}${id.slice(1)}Body`)}</p>
  </article>
))}
```

Se a construção dinâmica da chave for difícil de ler, escreve o array com as chaves completas — é mais verboso e mais claro:

```tsx
{[
  { id: "scoring", Icon: Lightning, titleKey: "featureScoringTitle", bodyKey: "featureScoringBody" },
  // …
]}
```

- [ ] **Step 4: Trocar os literais por chaves**

Converte as secções hero, features, tagline, how-it-works, examples e FAQ. Mantém **cada** `className`, `id` e `aria-labelledby` exatamente como está. Esta task não muda uma linha de CSS.

Deixa em paz: os nomes de demo `Alex / Sam`, `Dani / Nico` (`:441-442`), os numerais `0{i+1}` (`:374`), e os títulos decorativos `MATCH DAY` / `YOUR CLUB` dentro de arte `aria-hidden` (`:701`, `:709`).

- [ ] **Step 5: Verificar**

Run: `npm test`, depois com o dev a correr:

```bash
curl -s http://localhost:3003/ | grep -c 'home\.'
```

Esperado: `0` — nenhuma chave crua no ecrã.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/PlayfulHome.tsx src/messages
git commit -m "feat(i18n): extract home marketing copy"
```

---

### Task 5: Home — wizard de criação de board

~95 strings, as mais arriscadas do plano: muitas vivem em arrays indexados por estado, não em JSX inline.

**Files:**
- Modify: `src/components/home/PlayfulHome.tsx` (linhas ~521–1172), `src/components/home/HeroScoreDemo.tsx`
- Modify: `src/messages/*.json`

- [ ] **Step 1: Mover as const de módulo para dentro do componente**

`PlayfulHome.tsx:49-62` define `accents` no escopo do módulo, com `name` visível (`Court yellow`, `Rally pink`, `Club mint`, `Sky blue`). Fora do componente o `t()` não está em escopo.

O padrão: o array mantém-se no módulo mas perde o texto; o texto resolve-se no render.

```ts
// módulo
const accents = [
  { id: "court-yellow", value: "#f5ff36" },
  { id: "rally-pink", value: "#ff95c7" },
  { id: "club-mint", value: "#9af0ce" },
  { id: "sky-blue", value: "#99caff" },
] as const;
```

```tsx
// render
aria-label={t("accentUse", { color: t(`accent.${color.id}`) })}
```

- [ ] **Step 2: Acrescentar o namespace `wizard` ao `en.json`**

Cobre, por secção: o cabeçalho do diálogo (`:521-551`), os títulos de passo (`:556-577`), o passo 1 jogadores (`:599-678`), o passo 2 look e templates (`:680-888`), o passo 3 regras (`:941-1007`), o rodapé de passo (`:1009-1059`), o play stage (`:1062-1116`), o bloco go-live (`:1117-1139`) e o aside de preview (`:1143-1172`).

As interpolações que existem, e que têm de ser placeholders e não concatenação:

```json
"playerN": "Player {n}",
"pairPlayerAria": "{pair}, player {n}",
"accentUse": "Use {color}",
"templateAria": "{style} template",
"winnerNotice": "{team} wins. Good game!",
"setNotice": "Set {number} · {rule}",
"livePreview": "{style} · LIVE PREVIEW"
```

As quatro mensagens de erro em `:189`, `:215`, `:226` e `:235` estão fora do JSX (dentro de `throw`/`catch`) e são visíveis via `:1136`. Não as esqueças.

- [ ] **Step 3: Tirar a seta de dentro da string**

`PlayfulHome.tsx:886` tem `Fine-tune this template →` com a seta **dentro** do literal. Separa:

```tsx
{t("fineTuneTemplate")} <span aria-hidden="true">→</span>
```

- [ ] **Step 4: Converter o `HeroScoreDemo`**

8 strings, `'use client'`. O `aria-label` da linha 103 é interpolado — `` `Demo: add a point to ${name}` `` passa a `t("demoAddPoint", { name })`.

Os nomes `Galán / Chingotto` e `Coello / Tapia` (`:23-26`) **não** se traduzem.

Cuidado com `+ Point` (`:111`), `Play demo` / `Pause demo` (`:123`) e `Tap. Score. Simple.` (`:117`): todos em slots estreitos.

- [ ] **Step 5: Verificar o fluxo inteiro à mão**

Com o dev a correr, abre `http://localhost:3003/` e percorre o wizard até ao fim: nomes dos jogadores → escolher look → escolher template → regras → jogar pontos → undo → go-live.

```bash
curl -s http://localhost:3003/ | grep -c 'wizard\.'
```

Esperado: `0`.

- [ ] **Step 6: Commit**

```bash
git add src/components/home src/messages
git commit -m "feat(i18n): extract home wizard copy"
```

---

### Task 6: Sub-componentes do wizard

Todos alcançáveis por visitante anónimo, todos partilhados com a app autenticada.

**Files:**
- Modify: `src/components/workspace/FinishSetup.tsx`, `src/components/scoreboard/BrandBoardGenerator.tsx`, `src/components/scoreboard/CustomBoardEditor.tsx`, `src/components/scoreboard/LogoPicker.tsx`, `src/components/workspace/SignIn.tsx`
- Modify: `src/messages/*.json`

- [ ] **Step 1: `FinishSetup` → namespace `account` (~30 strings)**

`'use client'`. Os `<option>` de papel (`:184-187`) e os estilos de avatar (`:157-161`) são ternários sobre enums persistidos — o texto sai, o `value` fica.

Os literais de fallback em `:75` (`"Please try again."`) e `:100` (`"Please retry."`) estão fora do JSX.

O `aria-label` interpolado de `:140` (`` `Avatar color ${c}` ``) recebe um hex — interpola-se, não se traduz.

As chaves de `:126`, `:130` e `:204` são do ramo `editProfile`, só alcançável autenticado. Extraem-se na mesma.

- [ ] **Step 2: `BrandBoardGenerator` → namespace `boardEditor` (~24 strings)**

`'use client'`. Seis mensagens de erro/estado visíveis via `:227` — `:52`, `:64`, `:89`, `:94`, `:99` e os avisos de privacidade `:186-188`.

**`OpenAI` (`:187`, `:188`) não se traduz** e tem de sobreviver dentro da frase traduzida.

`Inspired by {…}` (`:252-260`) é prosa mais uma lista de `<a>` — usa interpolação de componentes com `t.rich()`, nunca concatenação de strings.

A referência a **"Fine-tune"** em `:193-194` nomeia o separador irmão definido em `PlayfulHome.tsx:884` — as duas chaves têm de ficar consistentes. Usa a mesma chave nos dois sítios.

- [ ] **Step 3: `CustomBoardEditor` → namespace `boardEditor` (~32 strings)**

`'use client'`. Duas const arrays com `label` (`:89-99` cores, `:217-229` layout): o texto sai para chaves indexadas pelo `key`, o `key` fica — são nomes de propriedade de `CustomBoardDesign`, persistidos.

Cada label de layout serve de texto visível (`:233`) **e** de `aria-label` (`:237`): uma chave serve os dois.

`logoText: "PADELBOARD"` (`:166`) é a marca — não se traduz.

O `title` de `:283` contém o hex literal `#173f37`, que tem de sobreviver: `t("hexHint", { example: "#173f37" })`.

`{design[key]} px` (`:234`) — a unidade e o espaço são padrão número+unidade; passa a mensagem interpolada.

- [ ] **Step 4: `LogoPicker` → namespace `boardEditor` (~12 strings)**

Renderizado pelos dois editores (`BrandBoardGenerator.tsx:169`, `CustomBoardEditor.tsx:138`). Se ficasse de fora, o passo de look custom ficava meio traduzido.

- [ ] **Step 5: `SignIn` → namespace `account`**

Renderizado por `FinishSetup.tsx:111`; é a primeira coisa que um visitante anónimo vê na fase de login.

- [ ] **Step 6: Verificar**

Run: `npm test && npx tsc --noEmit`

No browser, percorre: wizard → passo 2 → "Create your own" → ambos os separadores (AI e Fine-tune) → upload de logo → guardar.

- [ ] **Step 7: Commit**

```bash
git add src/components src/messages
git commit -m "feat(i18n): extract board editor and account copy"
```

---

### Task 7: Página de ajuda

~85 strings, das quais ~24 são rich com `<b>`.

**Files:**
- Modify: `src/app/[locale]/help/page.tsx`, `src/app/[locale]/help/HelpGuides.tsx`
- Modify: `src/messages/*.json`

- [ ] **Step 1: `generateMetadata` na página**

`help/page.tsx:11-13` tem um `export const metadata` estático, que não pode variar por língua. Passa a `generateMetadata`, igual ao padrão do manifesto da Fase 1, e acrescenta `alternates: { languages: localeAlternates("/help") }`.

- [ ] **Step 2: Trocar os `Link` por locale-aware**

`help/page.tsx:28,29,30,34` e `HelpGuides.tsx:196,387` usam `href` sem prefixo. O teste da Task 2 apanha os de `help/page.tsx`; os do `HelpGuides` estão em `src/components`, fora do alcance do teste — corrige-os à mão.

- [ ] **Step 3: Acrescentar o namespace `help`, respeitando a decisão 2**

Os labels de UI dentro de `<b>` **ficam em inglês** em todas as línguas. A prosa à volta traduz-se. Exemplo de como fica a chave:

```json
"studioStepOneBody": "Open a match from <b>My matches</b>. In the <b>Live</b> tab, leave the output on <b>Padelboard Studio</b>. This is your camera preview and scoring desk in one place."
```

Na tradução pt-BR, o conteúdo dos `<b>` não muda:

```json
"studioStepOneBody": "Abra uma partida em <b>My matches</b>. Na aba <b>Live</b>, deixe a saída em <b>Padelboard Studio</b>. Aqui ficam o preview da câmera e a mesa de pontuação, no mesmo lugar."
```

- [ ] **Step 4: Cuidado com dois detalhes do `HelpGuides`**

- `:355` tem um `.` órfão depois de um `</b>`. Um extrator distraído perde-o.
- `:80` tem `<span className="pbh-sr">Step {n}: </span>` — só para leitores de ecrã, e o espaço final e os dois pontos fazem parte do conteúdo.

- [ ] **Step 5: Os ternários de "Before you start"**

`:186-192` escolhe strings por `guide === "studio"`. Passa a chaves distintas (`kitStudioCamera`, `kitObsInstalled`, …) e mantém o ternário a escolher **a chave**, não o texto.

- [ ] **Step 6: Verificar**

```bash
curl -s http://localhost:3003/help | grep -c 'help\.'
```

Esperado: `0`. Depois clica os dois separadores (Studio e OBS) e confirma que o conteúdo muda.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/[locale]/help' src/messages
git commit -m "feat(i18n): extract help guides copy"
```

---

### Task 8: Tradução pt-BR

A partir daqui a app deixa de ser só inglesa. As Tasks 1–7 deixaram `en.json` completo e `pt/it/es.json` com o conteúdo inglês copiado; agora substitui-se.

**Files:**
- Modify: `src/messages/pt.json`
- Test: `src/lib/__tests__/i18n-messages.test.ts`

- [ ] **Step 1: Acrescentar um teste de placeholders**

A paridade de chaves não chega: uma tradução que perca um `{name}` ou um `<b>` compila e só parte em produção.

Acrescenta a `src/lib/__tests__/i18n-messages.test.ts`:

```ts
/** Extrai {placeholders} e <tags> de uma mensagem ICU. */
function markersOf(message: string): string[] {
  return [
    ...(message.match(/\{(\w+)/g) ?? []),
    ...(message.match(/<\/?(\w+)>/g) ?? []),
  ].sort()
}

function flatten(obj: Messages, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object') Object.assign(acc, flatten(v as Messages, path))
    else acc[path] = String(v)
    return acc
  }, {})
}

describe('placeholders e tags', () => {
  const english = flatten(en as Messages)

  for (const [locale, messages] of Object.entries({ pt, it: it_, es })) {
    it(`${locale} preserva todos os placeholders e tags de en`, () => {
      const translated = flatten(messages as Messages)
      const broken = Object.keys(english).filter(
        (key) =>
          markersOf(english[key]).join() !== markersOf(translated[key] ?? '').join(),
      )

      expect(broken).toEqual([])
    })
  }
})
```

- [ ] **Step 2: Correr o teste**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: PASS — pt/it/es ainda têm o texto inglês, logo os marcadores batem certo. O teste está a proteger o trabalho que vem a seguir.

- [ ] **Step 3: Traduzir `pt.json`, namespace a namespace**

Ordem: `metadata`, `common`, `home`, `manifesto`, `wizard`, `boardEditor`, `account`, `help`, `boardStyles`, `rules`.

Aplica as **Regras de tradução** no topo deste plano. Em particular:

- pt-BR, não pt-PT: `você`, `time`/`dupla`, `tela`, `celular`.
- Reposiciona cada `<br></br>` para a métrica da frase portuguesa. Não copies a posição inglesa.
- Os labels de UI dentro de `<b>` no namespace `help` ficam em inglês.
- `Star Point` fica; `Golden point` → `Ponto de ouro`; `Advantage` → `Vantagem`.
- Transcria os trocadilhos. `Game. Set. Stream.` não tem tradução literal que funcione.

- [ ] **Step 4: Correr os testes**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: PASS. Se `placeholders e tags` falhar, a lista de chaves partidas diz exatamente onde se perdeu um `{n}` ou um `</b>`.

- [ ] **Step 5: Ver com os próprios olhos**

```bash
for p in /pt /pt/manifesto /pt/help; do
  printf '%s -> %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3003$p)"
done
```

Abre `http://localhost:3003/pt` e percorre o wizard inteiro. Procura texto cortado ou a transbordar — os slots foram desenhados para inglês.

- [ ] **Step 6: Commit**

```bash
git add src/messages/pt.json src/lib/__tests__/i18n-messages.test.ts
git commit -m "feat(i18n): translate public surfaces to pt-BR"
```

---

### Task 9: Tradução italiana

**Files:** Modify `src/messages/it.json`

- [ ] **Step 1: Traduzir, namespace a namespace**

Mesmas regras. Notas específicas do italiano:

- Termos de broadcast e padel que soam amadores traduzidos: o italiano de padel usa `tiebreak`, `break point`, `golden point` em inglês correntemente. Como o namespace `scoreboard` é Fase 4, aqui só aparecem em prosa (`home.faqScoringA`, `rules.*`) — mantém o uso corrente italiano.
- `Golden point` → `Golden point` (uso corrente) ou `Punto d'oro`. Escolhe um e mantém-no em todo o ficheiro.
- O italiano é ~10% mais longo que o inglês. Atenção aos slots estreitos listados na Task 5, Step 4.

- [ ] **Step 2: Correr os testes**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: PASS.

- [ ] **Step 3: Verificar**

```bash
curl -s http://localhost:3003/it | grep -o '<html lang="[a-z]*"'
```

Esperado: `<html lang="it"`. Percorre o wizard em `/it`.

- [ ] **Step 4: Commit**

```bash
git add src/messages/it.json
git commit -m "feat(i18n): translate public surfaces to Italian"
```

---

### Task 10: Tradução espanhola

**Files:** Modify `src/messages/es.json`

- [ ] **Step 1: Traduzir, namespace a namespace**

Notas específicas do espanhol:

- É o mercado onde o padel tem vocabulário próprio mais assente. `Golden point` → `Punto de oro`. `Advantage` → `Ventaja`. `pair` → `pareja`, nunca `equipo`.
- O espanhol é a língua que mais cresce em comprimento (spec §3: `BREAK POINT` → `PUNTO DE BREAK`, +3). Os slots estreitos são o risco principal.
- Espanhol neutro, não regional.

- [ ] **Step 2: Correr os testes**

Run: `npm test`
Esperado: PASS — suite completa.

- [ ] **Step 3: Verificar**

Percorre o wizard em `/es`.

- [ ] **Step 4: Commit**

```bash
git add src/messages/es.json
git commit -m "feat(i18n): translate public surfaces to Spanish"
```

---

### Task 11: Verificação em Cloudflare Workers

**Files:** nenhum alterado — task de verificação.

- [ ] **Step 1: Suite completa**

Run: `npm test`
Esperado: PASS, incluindo paridade de chaves, placeholders, links e os testes pré-existentes.

- [ ] **Step 2: Build**

Run: `npm run build:cloudflare`
Esperado: `OpenNext build complete.` O aviso `Node.js middleware support is experimental in cloudflare` é esperado.

Confirma na tabela de rotas que `/[locale]`, `/[locale]/manifesto` e `/[locale]/help` aparecem prerenderizadas (`●`) nas quatro línguas.

- [ ] **Step 3: Preview no workerd**

Run: `npx opennextjs-cloudflare preview -- --port 8788`

- [ ] **Step 4: Verificar as quatro línguas no runtime real**

```bash
for l in "" /pt /it /es; do
  printf '%s -> %s\n' "${l:-/}" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8788${l:-/})"
done
curl -s http://127.0.0.1:8788/ | grep -o 'hreflang="[^"]*"'
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Accept-Language: es-ES,es;q=0.9' http://127.0.0.1:8788/help
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/overlay/abc123
```

Esperado: quatro `200`; quatro `hreflang` incluindo `pt-BR`; `307` para `/es/help`; e o overlay **sem** redirect de locale — é o teste que protege os placares em uso.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore(i18n): phase 2 verified on workerd"
```

---

## Definition of done

- [ ] `npm test` passa, incluindo paridade de chaves, placeholders e links locale-aware
- [ ] `npm run build:cloudflare` completa
- [ ] `/`, `/pt`, `/it`, `/es` respondem 200 e mostram a língua respetiva
- [ ] O wizard completo (nomes → look → regras → jogar → go-live) funciona nas quatro línguas
- [ ] `/help` traduzido na prosa, com os labels de UI em inglês
- [ ] `hreflang` com `href` **absoluto** (`https://…`, via `metadataBase`) e **específico da página** — `/pt/manifesto` declara `/manifesto`, não `/`
- [ ] `x-default` presente; `/login` e as restantes rotas não indexáveis **sem** hreflang
- [ ] `/overlay/[code]` continua sem redirect de locale e sem chrome por cima
- [ ] Nenhuma chave crua (`home.`, `wizard.`, `help.`…) visível em qualquer página
- [ ] Nenhum texto cortado ou a transbordar nos slots estreitos identificados

## O que fica por fazer

- **Fase 3:** dashboard, workspace, operador, wizard autenticado, erros de API, preferência de língua no perfil, seletor de língua, e a tradução dos labels de UI citados no `/help`.
- **Fase 4:** glossário do placar validado com o Gustavo, `locale` em `matches.overlay`, `TourScoreboard`, `scoreboard-labels.ts`, `StatusBadges.tsx`.
- **Design:** screenshots localizados para o `/help`.
