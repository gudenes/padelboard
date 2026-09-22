# Padelboard i18n — Fase 1 (infraestrutura) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar toda a infraestrutura de i18n do Padelboard — next-intl, segmento `[locale]`, `proxy.ts`, ficheiros de mensagens e testes de paridade — deixando a app inteira a funcionar exatamente como hoje, em inglês.

**Architecture:** `next-intl` com segmento `[locale]` e `localePrefix: 'as-needed'` (inglês sem prefixo). Um `proxy.ts` no runtime Node faz a negociação de língua e os redirects de compatibilidade. `/overlay/[code]`, `/api/*` e `/auth/callback` ficam deliberadamente fora do `[locale]`. A página `/manifesto` é extraída como piloto para provar a cadeia ponta a ponta; a extração das restantes ~44 superfícies é um plano seguinte.

**Tech Stack:** Next.js 16.3.5 (App Router), next-intl 4.14+, React 19, TypeScript 5.5, vitest 4, deploy Cloudflare Workers via `@opennextjs/cloudflare`.

**Spec:** [`docs/superpowers/specs/2026-09-22-padelboard-i18n-design.md`](../specs/2026-09-22-padelboard-i18n-design.md)

**Repo e branch:** `/Users/GuDenes/Documents/ChatGPT/PadelLabs/padelboard`, branch `claude`.

---

## Âmbito desta fase

**Dentro:** instalação e configuração do next-intl; `src/i18n/*`; `src/proxy.ts`; migração das rotas de UI para `src/app/[locale]/`; redirects de compatibilidade; `src/messages/{en,pt,it,es}.json` com o namespace `manifesto` real e `metadata`; teste de paridade de chaves; verificação do build Cloudflare.

**Fora (planos seguintes):** tradução de pt/it/es (Fase 2); extração das restantes superfícies (dashboard, wizard, workspace, operador, help, landing); erros de API; preferência de língua no perfil; seletor de língua; `locale` no `matches.overlay` e o glossário do placar (Fase 4).

**Nota sobre a precedência de línguas.** O spec define 5 níveis. Esta fase implementa os níveis 1, 2, 4 e 5 (URL → cookie `NEXT_LOCALE` → `Accept-Language` → `en`), que são os que o middleware do next-intl já cobre. O nível 3 (preferência do perfil) entra na Fase 3, junto com o seletor de língua que a escreve.

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
|---|---|
| `src/i18n/routing.ts` | Única fonte de verdade das línguas suportadas e da política de prefixo |
| `src/i18n/navigation.ts` | `Link`, `redirect`, `usePathname`, `useRouter` com consciência de locale |
| `src/i18n/request.ts` | Carrega o ficheiro de mensagens do pedido, no servidor |
| `src/proxy.ts` | Negociação de língua + redirects de compatibilidade |
| `src/messages/{en,pt,it,es}.json` | As mensagens, um ficheiro por língua |
| `src/app/[locale]/layout.tsx` | Layout com `lang` correto e `NextIntlClientProvider` |
| `src/lib/__tests__/i18n-messages.test.ts` | Paridade de chaves entre línguas |

---

### Task 1: Instalar next-intl e fixar a configuração de routing

**Files:**
- Modify: `package.json`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`

- [ ] **Step 1: Instalar a dependência**

```bash
cd /Users/GuDenes/Documents/ChatGPT/PadelLabs/padelboard
npm install next-intl@^4.14.6
```

Esperado: instala sem `ERESOLVE`. O peer `next ^16.0.0` é satisfeito pelo 16.3.5.

- [ ] **Step 2: Criar a configuração de routing**

Create `src/i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing'

export const locales = ['en', 'pt', 'it', 'es'] as const

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // Inglês sem prefixo; pt/it/es com prefixo. Ver secção 1 do spec.
  localePrefix: 'as-needed',
})

// O URL usa `pt`, mas o conteúdo é pt-BR e é isso que o hreflang declara.
export const hreflangByLocale: Record<Locale, string> = {
  en: 'en',
  pt: 'pt-BR',
  it: 'it',
  es: 'es',
}
```

- [ ] **Step 3: Criar os helpers de navegação**

Create `src/i18n/navigation.ts`:

```ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Esperado: sem erros. (Se houver erros pré-existentes noutros ficheiros, confirma que nenhum vem de `src/i18n/`.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/i18n/routing.ts src/i18n/navigation.ts
git commit -m "feat(i18n): add next-intl routing configuration"
```

---

### Task 2: Ficheiros de mensagens e teste de paridade de chaves

Este teste é o que impede a morte lenta do projeto: sem ele, alguém acrescenta uma string a `en.json` e as outras línguas apodrecem em silêncio.

**Files:**
- Create: `src/messages/en.json`, `src/messages/pt.json`, `src/messages/it.json`, `src/messages/es.json`
- Test: `src/lib/__tests__/i18n-messages.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/__tests__/i18n-messages.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import pt from '@/messages/pt.json'
import it_ from '@/messages/it.json'
import es from '@/messages/es.json'

type Messages = Record<string, unknown>

/** Achata { a: { b: "x" } } em ["a.b"], para comparar estruturas. */
function flattenKeys(obj: Messages, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value !== null && typeof value === 'object'
      ? flattenKeys(value as Messages, path)
      : [path]
  })
}

describe('ficheiros de mensagens', () => {
  const englishKeys = flattenKeys(en as Messages).sort()

  it('en.json não está vazio', () => {
    expect(englishKeys.length).toBeGreaterThan(0)
  })

  for (const [locale, messages] of Object.entries({ pt, it: it_, es })) {
    it(`${locale} tem exatamente as chaves de en`, () => {
      const localeKeys = flattenKeys(messages as Messages).sort()

      const missing = englishKeys.filter((k) => !localeKeys.includes(k))
      const extra = localeKeys.filter((k) => !englishKeys.includes(k))

      expect({ missing, extra }).toEqual({ missing: [], extra: [] })
    })
  }
})
```

- [ ] **Step 2: Correr o teste para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: FAIL — `Cannot find module '@/messages/en.json'`.

- [ ] **Step 3: Criar os quatro ficheiros de mensagens**

Create `src/messages/en.json`:

```json
{
  "metadata": {
    "title": "Padelboard — Free padel scoreboard for streamers",
    "description": "Free-forever streaming scoreboard for padel matches. OBS browser-source overlay with golden point, super-tiebreak, and phone-based control."
  }
}
```

Create `src/messages/pt.json`, `src/messages/it.json` e `src/messages/es.json` com **exatamente o mesmo conteúdo inglês** por agora. A tradução é a Fase 2; esta fase só precisa de estrutura válida e paridade de chaves.

```json
{
  "metadata": {
    "title": "Padelboard — Free padel scoreboard for streamers",
    "description": "Free-forever streaming scoreboard for padel matches. OBS browser-source overlay with golden point, super-tiebreak, and phone-based control."
  }
}
```

- [ ] **Step 4: Confirmar que o `resolveJsonModule` está ligado**

Run: `grep resolveJsonModule tsconfig.json`

Se não aparecer nada, acrescenta `"resolveJsonModule": true` dentro de `compilerOptions` em `tsconfig.json`.

- [ ] **Step 5: Correr o teste para confirmar que passa**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: PASS — 4 testes.

- [ ] **Step 6: Commit**

```bash
git add src/messages tsconfig.json src/lib/__tests__/i18n-messages.test.ts
git commit -m "feat(i18n): add message files with key-parity test"
```

---

### Task 3: Configuração de pedido no servidor

**Files:**
- Create: `src/i18n/request.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Criar o carregador de mensagens**

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing, type Locale } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Chave em falta cai para a string inglesa; nunca se mostra a chave crua.
    getMessageFallback({ key, namespace }) {
      const path = [namespace, key].filter(Boolean).join('.')
      console.warn(`[i18n] chave em falta: ${path} (locale ${locale})`)
      return path
    },
  }
})
```

- [ ] **Step 2: Ligar o plugin ao Next**

Modify `next.config.ts` — envolve a config exportada no plugin, preservando tudo o que já lá está:

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3003',
        'padelboard.padellabs.tech',
        'contact.padellabs.tech',
      ],
    },
  },
}

export default withNextIntl(config)
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Esperado: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/request.ts next.config.ts
git commit -m "feat(i18n): wire next-intl request config into Next"
```

---

### Task 4: proxy.ts com negociação de língua

O `proxy.ts` substitui o `middleware.ts` no Next 16 e corre no runtime Node. Confirmado a funcionar em Cloudflare Workers — ver secção 6 do spec.

**Files:**
- Create: `src/proxy.ts`

- [ ] **Step 1: Criar o proxy**

Create `src/proxy.ts`:

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Excluídos deliberadamente (secção 1 do spec):
  //   overlay  — URL colado como Browser Source no OBS; um prefixo partiria
  //              os placares em uso. A língua vem de matches.overlay.locale.
  //   api      — sem UI; erros traduzidos por Accept-Language.
  //   auth     — redirect registado no dashboard do Supabase; tem de ser estável.
  matcher: [
    '/((?!api|auth|overlay|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
```

- [ ] **Step 2: Verificar manualmente a negociação**

Run: `npm run dev`

Noutro terminal:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Accept-Language: it-IT,it;q=0.9' http://localhost:3003/manifesto
```

Esperado: `307` com redirect para `/it/manifesto`.

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3003/overlay/abc123
```

Esperado: **não** é 307 para `/en/overlay/...`. O overlay tem de continuar a responder no seu próprio caminho — este é o teste que protege os placares já em uso.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat(i18n): add locale-negotiating proxy, excluding overlay and api"
```

---

### Task 5: Mover as rotas de UI para o segmento [locale]

Esta é a task mais mecânica e a que mais parte se for feita a meio. Faz-se de uma vez.

**Files:**
- Move: `src/app/page.tsx`, `manifesto/`, `help/`, `login/`, `welcome/`, `dashboard/`, `m/` → `src/app/[locale]/`
- Modify: `src/app/layout.tsx` → dividido em root layout + `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Mover as rotas com o git, preservando histórico**

```bash
cd /Users/GuDenes/Documents/ChatGPT/PadelLabs/padelboard
mkdir -p 'src/app/[locale]'
git mv src/app/page.tsx 'src/app/[locale]/page.tsx'
git mv src/app/manifesto 'src/app/[locale]/manifesto'
git mv src/app/help 'src/app/[locale]/help'
git mv src/app/login 'src/app/[locale]/login'
git mv src/app/welcome 'src/app/[locale]/welcome'
git mv src/app/dashboard 'src/app/[locale]/dashboard'
git mv src/app/m 'src/app/[locale]/m'
```

Confirma que `src/app/overlay`, `src/app/api` e `src/app/auth` **não** foram movidos:

```bash
ls src/app
```

Esperado: `[locale]  api  auth  favicon.ico  globals.css  icon.png  layout.tsx  overlay`

- [ ] **Step 2: Reduzir o root layout ao mínimo**

O root layout deixa de declarar língua — é o layout do `[locale]` que o faz. Mas o Next exige `<html>` e `<body>` num root layout, e as rotas fora do `[locale]` (o overlay) também precisam dele.

Modify `src/app/layout.tsx`:

```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

- [ ] **Step 3: Criar o layout do locale**

Create `src/app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ProjectFooter } from "@/components/workspace/ProjectFooter";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
          <ProjectFooter />
          <FeedbackButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Dar `<html>` e `<body>` às rotas fora do locale**

O `/overlay/[code]` ficou sem `<html>`, porque o root layout passou a devolver `children` cru.

Create `src/app/overlay/layout.tsx`:

```tsx
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

O overlay fica em `lang="en"` nesta fase; a Fase 4 passa-o a ler `matches.overlay.locale`.

- [ ] **Step 5: Verificar que a app arranca e as rotas respondem**

Run: `npm run dev`

```bash
curl -s -o /dev/null -w '/ -> %{http_code}\n'            http://localhost:3003/
curl -s -o /dev/null -w '/pt -> %{http_code}\n'          http://localhost:3003/pt
curl -s -o /dev/null -w '/manifesto -> %{http_code}\n'   http://localhost:3003/manifesto
curl -s -o /dev/null -w '/it/manifesto -> %{http_code}\n' http://localhost:3003/it/manifesto
curl -s -o /dev/null -w '/login -> %{http_code}\n'       http://localhost:3003/login
```

Esperado: todos `200`.

Confirma que o `lang` muda:

```bash
curl -s http://localhost:3003/it/manifesto | grep -o '<html lang="[a-z]*"'
```

Esperado: `<html lang="it"`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(i18n): move UI routes under [locale] segment"
```

---

### Task 6: Redirects de compatibilidade para links já partilhados

Links `/m/<code>` já entregues a clubes passam a ter prefixo. O middleware do next-intl já redireciona caminhos sem prefixo para a língua detetada, o que cobre o caso. Esta task **prova** esse comportamento com um teste, em vez de assumir.

**Files:**
- Test: `src/lib/__tests__/i18n-routing.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/__tests__/i18n-routing.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { routing, locales, hreflangByLocale } from '@/i18n/routing'

describe('configuração de routing', () => {
  it('suporta exatamente en, pt, it e es', () => {
    expect([...locales].sort()).toEqual(['en', 'es', 'it', 'pt'])
  })

  it('tem o inglês como default sem prefixo', () => {
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localePrefix).toBe('as-needed')
  })

  it('declara hreflang pt-BR para o locale pt', () => {
    expect(hreflangByLocale.pt).toBe('pt-BR')
  })

  it('tem um hreflang para cada locale suportado', () => {
    expect(Object.keys(hreflangByLocale).sort()).toEqual([...locales].sort())
  })
})
```

- [ ] **Step 2: Correr o teste**

Run: `npx vitest run src/lib/__tests__/i18n-routing.test.ts`
Esperado: PASS — 4 testes. (A implementação já existe da Task 1; este teste tranca o contrato contra regressões.)

- [ ] **Step 3: Verificar manualmente o redirect de um link antigo**

Com `npm run dev` a correr:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Accept-Language: pt-BR,pt;q=0.9' http://localhost:3003/m/abc123
```

Esperado: `307` para `/pt/m/abc123`. Um link antigo não parte — muda de língua.

- [ ] **Step 4: Commit**

```bash
git add src/lib/__tests__/i18n-routing.test.ts
git commit -m "test(i18n): lock routing contract and locale set"
```

---

### Task 7: Extrair o /manifesto como piloto

Prova a cadeia inteira — mensagem no JSON, servida pelo request config, renderizada sob o locale certo — numa página pequena, antes de a extração em massa começar.

**Files:**
- Modify: `src/app/[locale]/manifesto/page.tsx`
- Modify: `src/messages/en.json`, `pt.json`, `it.json`, `es.json`

- [ ] **Step 1: Perceber as duas formas de string desta página**

A copy do manifesto não é texto simples. Tem duas complicações que decidem como as chaves são escritas:

1. **Quebras de linha deliberadas** — `Every match<br />deserves a <span>spotlight.</span>`. A quebra é escolha tipográfica e o `<span>` é o destaque a cor. Ambos têm de sobreviver à tradução, e a posição da quebra muda por língua.
2. **Um link inline** — `a <a href="https://padellabs.tech/">Padel Labs project ↗</a>` no meio de um parágrafo.

Nos dois casos usa-se `t.rich()` com tags, **nunca** interpolação de HTML por string. A regra prática: o JSON guarda a marcação semântica (`<b>`, `<br></br>`, `<link>`), o `.tsx` decide o que cada tag renderiza.

- [ ] **Step 2: Acrescentar o namespace `manifesto` aos quatro ficheiros**

Em `src/messages/en.json`, acrescenta este bloco. As chaves nomeiam o **papel** de cada string, não o conteúdo, para que traduzir não obrigue a renomear:

```json
"manifesto": {
  "metaTitle": "Our manifesto — Padelboard",
  "metaDescription": "Every match deserves a spotlight. Why Padelboard is a free Padel Labs initiative making professional-looking padel streams accessible to everyone.",
  "heroEyebrow": "THE PADELBOARD MANIFESTO",
  "heroTitle": "Every match<br></br>deserves a <hl>spotlight.</hl>",
  "heroLead": "A Friday-night friendly. A first tournament. A club final.<br></br>If it matters on court, it deserves to look the part on screen.",
  "heroScribble": "More courts.<br></br>More stories.<br></br>More padel.",
  "heroReadMore": "This is why we build",
  "beliefEyebrow": "01 / THE BELIEF",
  "beliefTitle": "Big-match energy.<br></br>On every court.",
  "beliefParagraphOne": "Padel is full of moments worth sharing. The impossible recovery. The deciding point. The pair who finally win their first match together.",
  "beliefParagraphTwo": "We believe a professional-looking broadcast should be within reach of anyone who wants to share those moments. A player. A friend. A coach. A club.",
  "beliefEmphasis": "You bring the match.<br></br>We help you bring it to the world.",
  "missionEyebrow": "02 / THE MISSION",
  "missionTitle": "Less setup.<br></br><hl>More “are you watching this?”</hl>",
  "missionCardOneTitle": "Make it simple.",
  "missionCardOneBody": "You should be thinking about the next point, not stitching together a pile of tools. A scoreboard, your match, and a simpler way to get it on screen.",
  "missionCardTwoTitle": "Make it look the part.",
  "missionCardTwoBody": "Clear scores. Your club’s colors. A broadcast you’re proud to share. Professional presentation should belong to every court, whatever the size of the event.",
  "missionCardThreeTitle": "Open the court.",
  "missionCardThreeBody": "Padelboard is a free initiative because the cost of a scoreboard shouldn’t stand between a match and its audience. More people should get to press play.",
  "impactEyebrow": "03 / THE BIGGER PICTURE",
  "impactTitle": "More matches seen.<br></br>More people hooked.<br></br><hl>More room for padel to grow.</hl>",
  "impactBody": "We want to be a catalyst. To help clubs reach their communities, players share their stories, and new fans discover the game. Making it easier to broadcast is our way of helping padel take its next step.",
  "impactScribble": "One stream can start something.",
  "labsEyebrow": "BUILT WITH PURPOSE",
  "labsTitle": "A little project.<br></br>A big love for padel.",
  "labsParagraphOne": "Padelboard is a <link>Padel Labs project ↗</link>. It’s our contribution to a sport we love: practical technology that helps more people take part.",
  "labsParagraphTwo": "We’re building for the people beside the court. And we want to keep learning from them. Every match you share, every idea, every bit of feedback helps shape what comes next.",
  "inviteScribble": "Your court is next.",
  "inviteTitle": "Let’s give your match<br></br>its moment.",
  "inviteCta": "Create your board",
  "inviteFootnote": "Free to get started. Made for the love of the game."
}
```

Os numerais decorativos (`01`, `02`, `03`) e as setas `↓`/`→` ficam no `.tsx`: são `aria-hidden` e não mudam com a língua.

Copia o **mesmo bloco inglês** para `pt.json`, `it.json` e `es.json`. A tradução é a Fase 2.

- [ ] **Step 3: Correr o teste de paridade**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: PASS. Se falhar com `missing`, esqueceste-te de copiar o bloco para alguma língua — é exatamente o que este teste existe para apanhar.

- [ ] **Step 4: Trocar as strings por chamadas ao tradutor**

Modify `src/app/[locale]/manifesto/page.tsx`. O ficheiro passa a async server component; o `metadata` estático passa a `generateMetadata`; e define-se **uma vez** o mapa de tags rich, reutilizado em todas as chamadas.

Cabeçalho e metadata:

> **Atenção ao `Link`.** O import muda de `next/link` para `@/i18n/navigation`. O
> `Link` do Next não sabe de locales: num `/it/manifesto`, um `href="/dashboard/new"`
> atirava o utilizador para o dashboard em inglês, perdendo a língua a meio do fluxo.
> O `Link` do next-intl preserva o prefixo ativo. Esta troca aplica-se a **todos** os
> links internos, em todas as páginas extraídas — daqui para a frente.

```tsx
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicHeader } from "@/components/home/PublicHeader";
import "@/components/home/playful.css";
import "./manifesto.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "manifesto" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
```

O mapa de tags — `br` fecha-se como `<br></br>` no JSON porque o ICU do next-intl não aceita tags vazias:

```tsx
const richTags = {
  br: () => <br />,
  hl: (chunks: React.ReactNode) => <span>{chunks}</span>,
  link: (chunks: React.ReactNode) => (
    <a href="https://padellabs.tech/" target="_blank" rel="noreferrer">
      {chunks}
    </a>
  ),
};
```

O corpo — cada literal passa a `t()` (texto simples) ou `t.rich()` (com marcação). Exemplo das três formas presentes na página:

```tsx
export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("manifesto");

  return (
    <div className="pb-home pb-manifesto">
      <div className="pb-sunshine">
        <PublicHeader manifesto />
        <main>
          <section className="pbm-hero pb-container" aria-labelledby="manifesto-title">
            <p className="pbm-eyebrow">{t("heroEyebrow")}</p>
            <h1 id="manifesto-title">{t.rich("heroTitle", richTags)}</h1>
            <div className="pbm-hero-bottom">
              <p>{t.rich("heroLead", richTags)}</p>
              <span className="pb-hand pbm-scribble">
                {t.rich("heroScribble", richTags)}
              </span>
            </div>
            <a className="pbm-read" href="#why">
              {t("heroReadMore")} <span aria-hidden="true">↓</span>
            </a>
          </section>

          {/* … as restantes secções seguem o mesmo padrão, chave a chave … */}

          <section className="pbm-invite pb-container" aria-labelledby="invite-title">
            <span className="pb-hand">{t("inviteScribble")}</span>
            <h2 id="invite-title">{t.rich("inviteTitle", richTags)}</h2>
            <Link href="/dashboard/new" className="pb-button">
              {t("inviteCta")} <span aria-hidden="true">→</span>
            </Link>
            <p>{t("inviteFootnote")}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
```

Converte **todas** as secções — hero, belief, mission, impact, labs, invite — mantendo cada `className`, `id` e `aria-labelledby` exatamente como estão. Esta task não muda uma linha de CSS nem de estrutura: só troca literais por chaves.

- [ ] **Step 5: Verificar as quatro línguas**

Com `npm run dev` a correr:

```bash
for p in /manifesto /pt/manifesto /it/manifesto /es/manifesto; do
  printf '%s -> %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3003$p)"
done
```

Esperado: todos `200`, e o texto visível idêntico nas quatro (ainda não há tradução).

Confirma que não ficou nenhuma chave crua no ecrã:

```bash
curl -s http://localhost:3003/pt/manifesto | grep -c 'manifesto\.'
```

Esperado: `0`.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/[locale]/manifesto/page.tsx' src/messages
git commit -m "feat(i18n): extract manifesto copy into message files"
```

---

### Task 8: Verificar o build de produção em Cloudflare Workers

A fase inteira existe para descobrir aqui um problema de infraestrutura, com a app ainda em inglês e revertível.

**Files:** nenhum alterado — é uma task de verificação.

- [ ] **Step 1: Correr a suite completa de testes**

Run: `npm test`
Esperado: PASS, incluindo os testes pré-existentes (`scoreboard-labels`, `padel-scoring`, `workspace-routing`, …). Qualquer falha aqui é regressão introduzida pela migração de rotas.

- [ ] **Step 2: Build para Cloudflare**

Run: `npm run build:cloudflare`

Esperado: termina com `OpenNext build complete.` O aviso `Node.js middleware support is experimental in cloudflare` é esperado e está documentado na secção 6 do spec — não é falha.

- [ ] **Step 3: Arrancar o preview no workerd**

Run: `npx opennextjs-cloudflare preview -- --port 8788`

- [ ] **Step 4: Verificar a negociação no runtime real**

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Accept-Language: es-ES,es;q=0.9' http://127.0.0.1:8788/manifesto
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/overlay/abc123
curl -s http://127.0.0.1:8788/it/manifesto | grep -o '<html lang="[a-z]*"'
```

Esperado, por ordem: `307` para `/es/manifesto`; o overlay a responder sem redirect de locale; `<html lang="it"`.

Se o primeiro comando devolver `200` em vez de `307`, o middleware não está a correr no workerd — aciona o plano B da secção 6 do spec (`localePrefix: 'always'` sem middleware) e **para**, em vez de continuar para a Fase 2.

- [ ] **Step 5: Commit final da fase**

```bash
git add -A
git commit -m "chore(i18n): phase 1 infrastructure verified on workerd"
```

---

## Definition of done

- [ ] `npm test` passa, incluindo paridade de chaves e os testes pré-existentes
- [ ] `npm run build:cloudflare` completa
- [ ] No workerd: `/manifesto` negocia para `/es/manifesto` com `Accept-Language: es`
- [ ] `/overlay/[code]` responde sem redirect de locale
- [ ] `<html lang>` reflete o locale da rota
- [ ] A app está inteiramente em inglês e visualmente idêntica a antes desta fase
