# Padelboard — seletor de língua Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a quem cai na língua errada uma forma de sair — um chip compacto no header público que troca de língua preservando a página, e que lembra a escolha por cookie e, para quem tem conta, entre dispositivos.

**Architecture:** Um componente cliente (`LanguageChip`) usa o `useRouter`/`usePathname` de `@/i18n/navigation` para trocar o locale mantendo o caminho; o `router.replace` escreve o cookie `NEXT_LOCALE`. Para utilizadores autenticados, um endpoint estreito grava a preferência no `user_metadata`, e o `/auth/callback` aplica-a no login escrevendo o cookie — em vez de o `proxy.ts` a ler em cada pedido.

**Tech Stack:** next-intl 4.14.6, Next.js 16.3.5 (App Router), React 19, TypeScript 5.5, vitest 4, Supabase, deploy Cloudflare Workers.

**Spec:** [`docs/superpowers/specs/2026-09-22-padelboard-language-selector-design.md`](../specs/2026-09-22-padelboard-language-selector-design.md)

**Repo e branch:** `/Users/GuDenes/Documents/ChatGPT/PadelLabs/padelboard`, branch `claude`.

---

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
|---|---|
| `src/i18n/routing.ts` | Ganha `localeNames` — fonte única dos nomes, fora das mensagens |
| `src/components/i18n/LanguageChip.tsx` | O controlo: pílula, painel, teclado, troca de locale |
| `src/app/api/profile/locale/route.ts` | Grava só o `locale` no perfil, sem tocar no resto |
| `src/lib/player-profile.ts` | `parsePlayerProfile` aceita `locale` opcional |
| `src/app/auth/callback/route.ts` | Aplica a preferência do perfil no login, via cookie |
| `src/components/home/playful.css` | Estilos do chip, junto aos do header |

## Porque um endpoint novo em vez de usar o `/api/profile`

O `POST /api/profile` existente chama `parsePlayerProfile()`, que **lança** se faltar `name`, `role`, `club`, `color` ou `style`. Enviar-lhe `{ locale: "pt" }` devolveria 400. Alargar o parse para aceitar payloads parciais arriscaria o caminho que guarda o perfil a sério. Um endpoint próprio, que só sabe fazer uma coisa, é mais barato e mais seguro.

## Porque o chip não recebe `signedIn`

O `PublicHeader` não sabe se há sessão, e threadá-lo até lá obrigaria a tocar em todas as páginas que o usam. Em vez disso o chip faz o POST sempre, em fire-and-forget: se não houver sessão o endpoint devolve 401 e o chip ignora. **A troca de língua nunca espera pelo POST nem é bloqueada por ele** — o cookie e a navegação são o que interessa; o perfil é um extra para outro dispositivo.

---

### Task 1: `localeNames` como fonte única

**Files:**
- Modify: `src/i18n/routing.ts`
- Test: `src/lib/__tests__/i18n-routing.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Acrescenta ao fim do `describe` existente em `src/lib/__tests__/i18n-routing.test.ts`:

```ts
  it('tem um nome para cada locale suportado', () => {
    expect(Object.keys(localeNames).sort()).toEqual([...locales].sort())
  })

  it('nomeia cada língua na própria língua', () => {
    expect(localeNames).toEqual({
      en: 'English',
      pt: 'Português',
      it: 'Italiano',
      es: 'Español',
    })
  })
```

E acrescenta `localeNames` ao import no topo do ficheiro:

```ts
import { routing, locales, hreflangByLocale, localeNames } from '@/i18n/routing'
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/i18n-routing.test.ts`
Esperado: FAIL — `localeNames` não existe.

- [ ] **Step 3: Implementar**

Acrescenta ao fim de `src/i18n/routing.ts`:

```ts
// Os nomes aparecem sempre na própria língua e NUNCA são traduzidos: quem
// precisa do seletor é quem está perdido numa língua que não percebe. Por
// isso vivem aqui e não em src/messages — lá seriam traduzidos pelo processo
// normal e o seletor deixava de servir o seu propósito.
export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  it: 'Italiano',
  es: 'Español',
}
```

- [ ] **Step 4: Correr para confirmar que passa**

Run: `npx vitest run src/lib/__tests__/i18n-routing.test.ts`
Esperado: PASS — 6 testes.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/routing.ts src/lib/__tests__/i18n-routing.test.ts
git commit -m "feat(i18n): add locale names as single source outside messages"
```

---

### Task 2: Trancar a decisão de não traduzir os nomes

Sem este teste, a regra é um comentário que alguém apaga daqui a seis meses.

**Files:**
- Test: `src/lib/__tests__/i18n-messages.test.ts`

- [ ] **Step 1: Escrever o teste**

Acrescenta ao fim de `src/lib/__tests__/i18n-messages.test.ts`:

```ts
describe('nomes de línguas', () => {
  const names = ['English', 'Português', 'Italiano', 'Español']

  for (const [locale, messages] of Object.entries({ en, pt, it: it_, es })) {
    it(`${locale} não contém nomes de línguas nas mensagens`, () => {
      const offenders = Object.entries(flattenValues(messages as Messages))
        .filter(([, value]) => names.includes(value.trim()))
        .map(([key]) => key)

      expect(offenders).toEqual([])
    })
  }
})
```

O `flattenValues` e o tipo `Messages` já existem nesse ficheiro, do teste de placeholders.

- [ ] **Step 2: Correr**

Run: `npx vitest run src/lib/__tests__/i18n-messages.test.ts`
Esperado: PASS — 11 testes. Passa já, porque os nomes ainda não lá estão; o valor é impedir que lá cheguem.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/i18n-messages.test.ts
git commit -m "test(i18n): keep language names out of message files"
```

---

### Task 3: `locale` opcional no perfil

Tem de ser **opcional**. Os perfis já gravados não o têm e o `parsePlayerProfile` lança em campo inválido — torná-lo obrigatório partia o login de toda a gente com conta.

**Files:**
- Modify: `src/lib/player-profile.ts`
- Test: `src/lib/__tests__/player-profile-locale.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Create `src/lib/__tests__/player-profile-locale.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parsePlayerProfile } from '@/lib/player-profile'

const valid = {
  name: 'Gu',
  role: 'player',
  club: '',
  color: '#f5ff36',
  style: 'headband',
}

describe('locale no perfil', () => {
  it('aceita um perfil sem locale', () => {
    expect(parsePlayerProfile(valid).locale).toBeUndefined()
  })

  it('guarda um locale suportado', () => {
    expect(parsePlayerProfile({ ...valid, locale: 'pt' }).locale).toBe('pt')
  })

  it('ignora um locale não suportado em vez de lançar', () => {
    expect(parsePlayerProfile({ ...valid, locale: 'de' }).locale).toBeUndefined()
  })

  it('ignora um locale que não é string', () => {
    expect(parsePlayerProfile({ ...valid, locale: 7 }).locale).toBeUndefined()
  })
})
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/player-profile-locale.test.ts`
Esperado: FAIL — `locale` não existe no objeto devolvido.

- [ ] **Step 3: Implementar**

Em `src/lib/player-profile.ts`, acrescenta o import no topo:

```ts
import { locales } from "@/i18n/routing";
```

E no `return` do `parsePlayerProfile`, acrescenta o campo:

```ts
  return {
    name: v.name.trim(),
    role: String(v.role),
    club: v.club.trim(),
    color: String(v.color),
    style: String(v.style),
    // Opcional de propósito: os perfis gravados antes do seletor não o têm,
    // e uma preferência de língua inválida não deve impedir guardar o perfil.
    locale: locales.includes(v.locale as (typeof locales)[number])
      ? (v.locale as string)
      : undefined,
  };
```

- [ ] **Step 4: Correr para confirmar que passa**

Run: `npx vitest run src/lib/__tests__/player-profile-locale.test.ts`
Esperado: PASS — 4 testes.

- [ ] **Step 5: Correr a suite toda**

Run: `npm test`
Esperado: PASS. Se `profile-api.test.ts` falhar por causa do campo novo, ajusta a expectativa — o campo é adicionado, nada foi removido.

- [ ] **Step 6: Commit**

```bash
git add src/lib/player-profile.ts src/lib/__tests__/player-profile-locale.test.ts
git commit -m "feat(i18n): accept optional locale in player profile"
```

---

### Task 4: Endpoint estreito para gravar a língua

**Files:**
- Create: `src/app/api/profile/locale/route.ts`
- Test: `src/lib/__tests__/profile-locale-api.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/__tests__/profile-locale-api.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const updateUser = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  serverSupabase: async () => ({ auth: { getUser, updateUser } }),
}))

import { POST } from '@/app/api/profile/locale/route'

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/profile/locale', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )
}

describe('POST /api/profile/locale', () => {
  beforeEach(() => {
    getUser.mockReset()
    updateUser.mockReset()
    updateUser.mockResolvedValue({ error: null })
  })

  it('devolve 401 sem sessão', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    expect((await post({ locale: 'pt' })).status).toBe(401)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('rejeita um locale não suportado', async () => {
    getUser.mockResolvedValue({ data: { user: { user_metadata: {} } } })

    expect((await post({ locale: 'de' })).status).toBe(400)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('preserva os restantes campos do perfil', async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          user_metadata: {
            padelboard_profile: { name: 'Gu', role: 'player', completed: true },
          },
        },
      },
    })

    expect((await post({ locale: 'it' })).status).toBe(200)
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        padelboard_profile: {
          name: 'Gu',
          role: 'player',
          completed: true,
          locale: 'it',
        },
      },
    })
  })
})
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/profile-locale-api.test.ts`
Esperado: FAIL — o módulo da rota não existe.

- [ ] **Step 3: Implementar**

Create `src/app/api/profile/locale/route.ts`:

```ts
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase-server";
import { locales } from "@/i18n/routing";

/**
 * Grava só a preferência de língua, sem tocar no resto do perfil.
 * Existe em separado do POST /api/profile porque esse exige um perfil
 * completo — enviar-lhe apenas { locale } devolveria 400.
 */
export async function POST(req: Request) {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { locale?: unknown } | null;
  const locale = body?.locale;
  if (!locales.includes(locale as (typeof locales)[number]))
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });

  const { error } = await sb.auth.updateUser({
    data: {
      padelboard_profile: {
        ...(user.user_metadata?.padelboard_profile ?? {}),
        locale,
      },
    },
  });
  if (error)
    return NextResponse.json(
      { error: "Could not save your language." },
      { status: 500 },
    );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Correr para confirmar que passa**

Run: `npx vitest run src/lib/__tests__/profile-locale-api.test.ts`
Esperado: PASS — 3 testes.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/profile/locale/route.ts src/lib/__tests__/profile-locale-api.test.ts
git commit -m "feat(i18n): add endpoint to store language preference"
```

---

### Task 5: O componente `LanguageChip`

**Files:**
- Create: `src/components/i18n/LanguageChip.tsx`
- Modify: `src/components/home/PublicHeader.tsx`
- Modify: `src/components/home/playful.css`
- Modify: `src/messages/{en,pt,it,es}.json`

- [ ] **Step 1: Acrescentar a chave do `aria-label`**

Este **é** traduzido — descreve a ação, não nomeia uma língua.

Em `src/messages/en.json`, dentro de `common`:

```json
"languageAria": "Change language",
```

Nas outras três, o valor traduzido:

- `pt.json`: `"languageAria": "Mudar de idioma",`
- `it.json`: `"languageAria": "Cambia lingua",`
- `es.json`: `"languageAria": "Cambiar idioma",`

- [ ] **Step 2: Criar o componente**

Create `src/components/i18n/LanguageChip.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";

export function LanguageChip() {
  const t = useTranslations("common");
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    // Fire-and-forget: sem sessão devolve 401 e não há nada a fazer. A troca
    // de língua nunca espera por isto — o cookie e a navegação é que contam.
    void fetch("/api/profile/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
    // O pathname do next-intl vem sem prefixo, por isso a página é preservada:
    // /it/help -> /pt/help, e não /pt.
    router.replace(pathname, { locale: next });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>(".pb-lang-chip")?.focus();
      return;
    }
    if (!open) return;

    const items = [
      ...(root.current?.querySelectorAll<HTMLButtonElement>(
        ".pb-lang-list button",
      ) ?? []),
    ];
    if (!items.length) return;

    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const to =
      e.key === "ArrowDown"
        ? (at + 1) % items.length
        : e.key === "ArrowUp"
          ? (at - 1 + items.length) % items.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? items.length - 1
              : -1;

    if (to === -1) return;
    e.preventDefault();
    items[to].focus();
  }

  return (
    <div className="pb-lang" ref={root} onKeyDown={onKeyDown}>
      <button
        type="button"
        className="pb-lang-chip"
        aria-label={t("languageAria")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="pb-lang-list"
        onClick={() => setOpen((v) => !v)}
      >
        {active.toUpperCase()}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="pb-lang-list" id="pb-lang-list" role="listbox">
          {locales.map((locale) => (
            <li key={locale}>
              <button
                type="button"
                role="option"
                aria-selected={locale === active}
                className={locale === active ? "is-active" : undefined}
                onClick={() => choose(locale)}
              >
                <span lang={locale}>{localeNames[locale]}</span>
                <span aria-hidden="true">{locale.toUpperCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Ao abrir o painel, foca a opção ativa para que as setas tenham um ponto de partida. Acrescenta este efeito ao componente:

```tsx
  useEffect(() => {
    if (!open) return;
    root.current
      ?.querySelector<HTMLButtonElement>(".pb-lang-list button.is-active")
      ?.focus();
  }, [open]);
```

- [ ] **Step 3: Estilos**

Acrescenta a `src/components/home/playful.css`, a seguir às regras `.pb-header`:

```css
.pb-lang {
  position: relative;
}
.pb-lang-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border: 2px solid var(--pb-black);
  border-radius: 20px;
  background: transparent;
  color: var(--pb-black);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}
.pb-lang-list {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 20;
  min-width: 150px;
  margin: 0;
  padding: 5px;
  list-style: none;
  background: var(--pb-black);
  border-radius: 10px;
}
.pb-lang-list button {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 6px 9px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #f4f3ea;
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
}
.pb-lang-list button:hover {
  background: rgba(255, 255, 255, 0.08);
}
.pb-lang-list button.is-active {
  background: var(--pb-yellow);
  color: var(--pb-black);
}
```

- [ ] **Step 4: Ligar ao header**

Em `src/components/home/PublicHeader.tsx`, acrescenta o import e mete o chip **antes** do CTA:

```tsx
import { LanguageChip } from "@/components/i18n/LanguageChip";
```

```tsx
      <LanguageChip />
      <Link className="pb-button pb-nav-cta" href="/login">{t("navSignIn")} <span aria-hidden="true">→</span></Link>
```

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm test`
Esperado: sem erros; a paridade de chaves apanha um `languageAria` esquecido nalguma língua.

Com o dev a correr:

```bash
curl -s http://localhost:3003/it/manifesto | grep -c 'pb-lang-chip'
```

Esperado: `1`.

No browser, em `/it/help`: abrir o chip, escolher Português, e confirmar que se chega a `/pt/help` — **não** a `/pt`.

Testar o teclado, que é metade do valor deste componente: abrir o chip e confirmar que o foco cai na língua ativa; `ArrowDown`/`ArrowUp` percorrem em ciclo; `Home`/`End` saltam para as pontas; `Escape` fecha e devolve o foco ao botão; clique fora fecha.

- [ ] **Step 6: Commit**

```bash
git add src/components src/messages
git commit -m "feat(i18n): add language chip to the public header"
```

---

### Task 6: Aplicar a preferência no login

**Files:**
- Modify: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Ler a preferência e escrever o cookie em todos os redirects**

Em `src/app/auth/callback/route.ts`, a seguir a `if (!userRes.user) return failure();`, acrescenta:

```ts
  const profileLocale = userRes.user.user_metadata?.padelboard_profile?.locale;
  const preferred = locales.includes(profileLocale) ? profileLocale : null;
  /**
   * Aplica a preferência de língua aqui, e não no proxy.ts: ler o perfil no
   * middleware obrigaria a autenticar contra o Supabase em cada pedido de UI.
   * Os caminhos abaixo continuam sem prefixo — o proxy prefixa-os a partir
   * deste cookie.
   */
  const go = (path: string) => {
    const res = NextResponse.redirect(`${url.origin}${path}`);
    if (preferred) res.cookies.set("NEXT_LOCALE", preferred, { path: "/" });
    return res;
  };
```

E o import no topo:

```ts
import { locales } from "@/i18n/routing";
```

- [ ] **Step 2: Passar os redirects a usar o `go`**

Substitui os quatro redirects que vêm depois, mantendo os caminhos exatamente como estão:

```ts
  if (!remote && !userRes.user.user_metadata?.padelboard_profile?.completed)
    return go(`/welcome${matchId ? `?match=${matchId}` : ""}`);
  if (!matchId) return go("/dashboard");
```

```ts
  if (!data?.short_code) return go("/dashboard");
  const response = go(`/m/${data.short_code}${remote ? "/remote" : ""}`);
  response.cookies.delete("padelboard_pending_match");
  return response;
```

O `failure()` **não** muda: quem falhou a autenticação não tem perfil de onde ler.

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm test`
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat(i18n): apply profile language preference at sign-in"
```

---

### Task 7: Verificação final

**Files:** nenhum alterado.

- [ ] **Step 1: Suite completa**

Run: `npm test`
Esperado: PASS, incluindo paridade de chaves, placeholders, nomes fora das mensagens e os testes novos.

- [ ] **Step 2: Build para Cloudflare**

Run: `npm run build:cloudflare`
Esperado: `OpenNext build complete.` Confirma que `/api/profile/locale` aparece na tabela de rotas.

- [ ] **Step 3: Preview no workerd**

Run: `npx opennextjs-cloudflare preview -- --port 8788`

```bash
curl -s http://127.0.0.1:8788/it/help | grep -c 'pb-lang-chip'
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'content-type: application/json' \
  -d '{"locale":"pt"}' http://127.0.0.1:8788/api/profile/locale
```

Esperado: `1`; e `401` no POST, porque o curl não tem sessão — é a prova de que o endpoint exige autenticação.

- [ ] **Step 4: Percorrer à mão nas quatro línguas**

Em `/`, `/pt/help`, `/it/manifesto` e `/es`: abrir o chip, trocar de língua, confirmar que a **página é preservada** e que o chip mostra a nova língua. Confirmar que o painel fecha com `Escape` e com clique fora, e que o foco volta ao botão.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore(i18n): language selector verified on workerd"
```

---

## Definition of done

- [ ] `npm test` passa, incluindo os testes novos
- [ ] `npm run build:cloudflare` completa
- [ ] O chip aparece nas três páginas públicas, nas quatro línguas
- [ ] Trocar de língua **preserva a página** (`/it/help` → `/pt/help`)
- [ ] Os nomes aparecem na própria língua e não estão em `src/messages`
- [ ] Teclado completo: setas em ciclo, `Home`/`End`, `Escape` fecha e devolve o foco ao botão; clique fora fecha
- [ ] `POST /api/profile/locale` devolve 401 sem sessão e preserva os restantes campos do perfil
- [ ] Um perfil sem `locale` continua a guardar sem erro

## Fora de âmbito

- Seletor no `WorkspaceHeader` — Fase 3, quando o workspace estiver traduzido
- Língua do placar (`matches.overlay.locale`) — Fase 4
- Deteção de discrepância entre `Accept-Language` e a língua ativa
