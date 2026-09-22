# Padelboard i18n — Fase 3 (app autenticada) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traduzir a app autenticada — dashboard, workspace, operador, erros de API e formatação de datas — para que um utilizador possa fazer o fluxo completo, do login ao fim da partida, numa só língua.

**Architecture:** Mesma disciplina das fases anteriores: extrair tudo para `en.json` primeiro, com a app a funcionar e em inglês, e só depois traduzir. Os erros de API passam a devolver **códigos estáveis**, traduzidos no cliente — a API fica sem língua, o que também serve os consumidores que não são UI. Dois componentes partilhados com o overlay recebem tratamento especial, porque lá não existe provider de i18n.

**Tech Stack:** next-intl 4.14.6, Next.js 16.3.5 (App Router), React 19, TypeScript 5.5, vitest 4, Supabase, Cloudflare Workers.

**Spec:** [`2026-09-22-padelboard-i18n-design.md`](../specs/2026-09-22-padelboard-i18n-design.md) §8, fase 3.

**Repo e branch:** `/Users/GuDenes/Documents/ChatGPT/PadelLabs/padelboard`, a partir de `main`.

---

## Âmbito

**Dentro:** ~350 strings — rotas do dashboard/welcome/operador (~57), componentes do workspace (~225), erros de API (~36 prosa + ~10 em libs), e a formatação de datas por locale.

**Fora:** o glossário do placar (`src/lib/scoreboard-labels.ts`) e `matches.overlay.locale` — **Fase 4**, e bloqueados até o Gustavo validar a lista de termos. O spec §3 exige essa validação antes de entrar em código.

## Três achados do inventário que mandam no desenho

### 1. `AnimatedMatchTime` rebenta se lhe puseres `useTranslations()`

É importado por `src/lib/templates/tour.tsx:1`, que é o caminho de render do **overlay**. O `/overlay` fica **fora** do `[locale]`, logo não tem `NextIntlClientProvider` na árvore. Um `useTranslations()` lá dentro não mostra a língua errada — **lança em runtime**, no ecrã de quem está a transmitir ao vivo.

A string é uma só: `MATCH TIME ·` (`AnimatedMatchTime.tsx:12`). **Passa a prop**, fornecida por cada consumidor: o workspace passa a versão traduzida, o overlay passa a inglesa (até a Fase 4 lhe dar a língua da base de dados).

O mesmo vale para `MatchDuration.tsx`, que está no caminho mas não tem strings.

### 2. Traduzir `matchStatus()` parte uma classe de CSS

`src/lib/match-search.ts:5-12` devolve 6 palavras de estado. Esse valor é ao mesmo tempo:
- mostrado ao utilizador (`MatchHistory.tsx:113`)
- indexado para pesquisa (`MatchHistory.tsx:27`)
- **comparado com o literal `"Live"` para aplicar a classe `is-live`** (`MatchHistory.tsx:111`)

Traduzir a função faz o placar deixar de ficar verde em português. Separa-se em `matchStatusId(row)` — enum, para lógica e CSS — e uma chave de tradução para o que se vê.

### 3. Dois ficheiros são código morto

`src/app/[locale]/m/[code]/ShareDialog.tsx` (5 strings) e `src/components/workspace/MatchInsights.tsx` (3 strings) não têm importadores em lado nenhum. **Apagam-se em vez de se traduzirem** — traduzir código morto é pagar três vezes por nada.

---

## Namespaces novos

```
dashboard    dashboard, welcome, histórico de partidas
workspace    MatchWorkspace, WorkspaceHeader, ScoreboardEditor, AddToScreen, PhoneControl
operator     Operator, controlos de pontuação
studio       BrowserStudio, BroadcastGuide
insights     MatchAnalytics
errors       códigos de erro da API e dos validadores
```

---

### Task 1: Apagar o código morto

Menos 8 strings para traduzir e dois ficheiros a menos para manter.

**Files:**
- Delete: `src/app/[locale]/m/[code]/ShareDialog.tsx`, `src/components/workspace/MatchInsights.tsx`

- [ ] **Step 1: Confirmar que não têm importadores**

```bash
grep -rn 'ShareDialog\|MatchInsights' src/ --include='*.tsx' --include='*.ts' | grep -v 'ShareDialog.tsx:\|MatchInsights.tsx:'
```

Esperado: nada. **Se aparecer alguma coisa, para e reporta** — o inventário estava errado e apagar partiria a app.

- [ ] **Step 2: Apagar**

```bash
git rm 'src/app/[locale]/m/[code]/ShareDialog.tsx' src/components/workspace/MatchInsights.tsx
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm test`
Esperado: ambos limpos.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove unused ShareDialog and MatchInsights"
```

---

### Task 2: Separar identidade de apresentação no estado das partidas

Antes de traduzir seja o que for, corrigir o acoplamento que faz a tradução partir o CSS.

**Files:**
- Modify: `src/lib/match-search.ts`, `src/components/workspace/MatchHistory.tsx`
- Test: `src/lib/__tests__/match-search.test.ts`

- [ ] **Step 1: Ver o teste que já existe**

Run: `npx vitest run src/lib/__tests__/match-search.test.ts`
Esperado: PASS. Toma nota do que ele assegura — não o enfraqueças nos passos seguintes.

- [ ] **Step 2: Escrever o teste do novo contrato**

Acrescenta a `src/lib/__tests__/match-search.test.ts`:

```ts
import { matchStatusId } from '@/lib/match-search'

describe('identidade do estado', () => {
  it('devolve um id estável, não texto visível', () => {
    expect(matchStatusId({ status: 'published', state: { phase: 'playing' } } as never)).toBe('live')
  })

  it('distingue terminada de abandonada', () => {
    expect(matchStatusId({ status: 'finished' } as never)).toBe('finished')
    expect(matchStatusId({ status: 'abandoned' } as never)).toBe('abandoned')
  })
})
```

Ajusta a forma dos objetos à do `matchStatus()` real — lê a função antes de escrever o teste.

- [ ] **Step 3: Correr para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/match-search.test.ts`
Esperado: FAIL — `matchStatusId` não existe.

- [ ] **Step 4: Implementar**

Em `src/lib/match-search.ts`, acrescenta `matchStatusId(row)` que devolve os ids (`live`, `finished`, `abandoned`, `draft`, …) espelhando a lógica do `matchStatus()` atual. **Mantém o `matchStatus()`** por agora — é usado no índice de pesquisa.

- [ ] **Step 5: Usar o id na classe de CSS**

Em `MatchHistory.tsx:111`, troca a comparação com o literal `"Live"` por `matchStatusId(row) === "live"`. A classe deixa de depender da língua.

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test`

- [ ] **Step 7: Commit**

```bash
git add src/lib/match-search.ts src/components/workspace/MatchHistory.tsx src/lib/__tests__/match-search.test.ts
git commit -m "refactor: separate match status identity from its display label"
```

---

### Task 3: Erros de API como códigos estáveis

Hoje cada rota escreve a sua própria prosa inglesa, e o cliente faz `throw new Error(json.error)` seguido de `setError(e.message)`. Não há helper partilhado.

Passar a códigos deixa a API sem língua — o que também serve o cron e os consumidores que não são UI — e põe a tradução onde há provider.

**Files:**
- Create: `src/lib/api-errors.ts`, `src/lib/__tests__/api-errors.test.ts`
- Modify: as 7 rotas com prosa, `src/lib/board-edit.ts`, `src/lib/player-profile.ts`
- Modify: `src/messages/*.json` (namespace `errors`)

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/__tests__/api-errors.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/lib/api-errors'
import en from '@/messages/en.json'

describe('códigos de erro', () => {
  it('cada código tem uma mensagem em en.json', () => {
    const missing = API_ERROR_CODES.filter(
      (code) => !(code in (en as Record<string, Record<string, string>>).errors),
    )

    expect(missing).toEqual([])
  })

  it('não há mensagens órfãs sem código', () => {
    const extra = Object.keys((en as Record<string, Record<string, string>>).errors).filter(
      (key) => !API_ERROR_CODES.includes(key as (typeof API_ERROR_CODES)[number]),
    )

    expect(extra).toEqual([])
  })
})
```

Este teste é o que impede a deriva nos dois sentidos: um código sem mensagem mostra a chave crua; uma mensagem sem código é peso morto.

- [ ] **Step 2: Correr para confirmar que falha**

Run: `npx vitest run src/lib/__tests__/api-errors.test.ts`
Esperado: FAIL — o módulo não existe.

- [ ] **Step 3: Enumerar os códigos**

Create `src/lib/api-errors.ts` com a lista de códigos, um por mensagem de prosa existente. Percorre estas rotas e converte cada literal num código, agrupando duplicados:

`api/board-design/route.ts` (9) · `api/matches/[id]/action/route.ts` (8) · `api/matches/[id]/design/route.ts` (5) · `api/profile/route.ts` (4) · `api/matches/[id]/claim/route.ts` (4) · `api/feedback/route.ts` (3) · `api/profile/locale/route.ts` (3)

Mais os validadores em `src/lib/board-edit.ts` (6 `throw`) e `src/lib/player-profile.ts` (4 `throw`).

Nomeia os códigos pelo **problema**, não pela frase: `match_not_found`, `not_owner`, `design_invalid`, `rate_limited`.

**Os códigos que já existem** (`no_file`, `rate_limited`, `unauthorized`, …) mantêm-se como estão — não lhes mexas.

- [ ] **Step 4: Acrescentar o namespace `errors` aos quatro ficheiros**

Uma chave por código, com a frase inglesa que lá estava. Copia verbatim para pt/it/es — a tradução é uma task posterior.

- [ ] **Step 5: Traduzir no cliente**

Nos 4 sítios que fazem passthrough (`Operator.tsx:49,54`, `BrowserStudio.tsx:219,222`, `ScoreboardEditor.tsx:56,63`, `FeedbackButton.tsx:50`), o `json.error` passa a ser um código e resolve-se com `useTranslations("errors")`. Se o código for desconhecido, cai para uma mensagem genérica — **nunca mostres o código cru ao utilizador**.

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test`

- [ ] **Step 7: Commit**

```bash
git add src/lib/api-errors.ts src/lib/__tests__/api-errors.test.ts src/app/api src/lib/board-edit.ts src/lib/player-profile.ts src/messages src/components
git commit -m "refactor(i18n): return stable error codes from the API"
```

---

### Task 4: Datas e pesquisa por locale

**Files:**
- Modify: `src/components/workspace/MatchHistory.tsx`, `src/lib/match-search.ts`
- Test: `src/lib/__tests__/match-search.test.ts`

- [ ] **Step 1: A data visível**

`MatchHistory.tsx:116` fixa `toLocaleDateString("en-GB", …)`. É componente cliente, portanto usa o formatador do next-intl:

```tsx
const format = useFormatter();
// …
{format.dateTime(new Date(row.created_at), { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
```

- [ ] **Step 2: O índice de pesquisa — indexar as duas línguas**

`match-search.ts:40-41` formata a mesma data duas vezes, mas **não mostra nada**: alimenta o índice de pesquisa, para se poder escrever "September" ou "22/09".

`matchesSearch()` é função pura sem acesso ao locale. Acrescenta um parâmetro `locale` opcional e indexa **as duas** formas — a inglesa e a do locale ativo:

```ts
export function matchesSearch(row: MatchRow, query: string, locale?: string) {
  // … fields.push(...dateTokens(date, 'en-GB'))
  // … if (locale) fields.push(...dateTokens(date, locale))
}
```

Manter o `en-GB` não é preguiça: um utilizador brasileiro que aprendeu a escrever "September" continua a encontrar, e quem escreve "setembro" passa a encontrar. Tirar o inglês partiria a pesquisa a quem já a usa.

- [ ] **Step 3: Testar as duas formas**

Acrescenta ao teste existente um caso que prova que a mesma partida é encontrada por "setembro" com `locale: 'pt'` **e** por "September" sem locale.

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc --noEmit && npm test
git add src/components/workspace/MatchHistory.tsx src/lib/match-search.ts src/lib/__tests__/match-search.test.ts
git commit -m "feat(i18n): format and index match dates by locale"
```

---

### Task 5: `AnimatedMatchTime` — a string que não pode usar hooks

**Files:**
- Modify: `src/components/workspace/AnimatedMatchTime.tsx`, `src/lib/templates/tour.tsx`, `src/components/workspace/MatchWorkspace.tsx`, `src/components/workspace/BrowserStudio.tsx`

- [ ] **Step 1: Passar o label a prop**

`AnimatedMatchTime.tsx:12` tem `MATCH TIME ·`. O componente é importado por `src/lib/templates/tour.tsx:1`, que renderiza **dentro do overlay** — fora do `[locale]`, sem `NextIntlClientProvider`. Um `useTranslations()` aqui **lança em runtime**, no ecrã de quem está a transmitir.

Acrescenta uma prop `label` com o default inglês:

```tsx
export function AnimatedMatchTime({ label = "MATCH TIME ·", ... }) {
```

- [ ] **Step 2: Os consumidores do workspace passam a versão traduzida**

Em `MatchWorkspace.tsx:261` e `BrowserStudio.tsx:432`, passa `label={t("matchTime")}`.

Em `src/lib/templates/tour.tsx`, **não passes nada** — fica o default inglês até a Fase 4 lhe dar a língua de `matches.overlay.locale`.

- [ ] **Step 3: Provar que o overlay não rebenta**

Com o dev a correr, abre um `/overlay/<code>` de uma partida publicada real e confirma que pinta. Se não tiveres um código à mão, **pede um em vez de assumir** — é a superfície com utilizadores ao vivo.

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace src/lib/templates/tour.tsx
git commit -m "refactor(i18n): pass match-time label as a prop to keep the overlay hook-free"
```

---

### Task 6: Extrair o dashboard e o welcome (~13 strings)

**Files:** `src/app/[locale]/dashboard/{page,new/page,profile/page}.tsx`, `src/app/[locale]/welcome/page.tsx` · namespace `dashboard`

Todos server components — usa `getTranslations()`.

A interpolação em `dashboard/page.tsx:35` (`Hey, {name}. Ready for a rally?`) é placeholder ICU, não concatenação.

- [ ] **Step 1: Extrair, copiar para as quatro línguas, verificar, commit**

```bash
npx tsc --noEmit && npm test
git commit -m "feat(i18n): extract dashboard and welcome copy"
```

---

### Task 7: Extrair o workspace (~125 strings)

**Files:** `MatchWorkspace` (~39), `MatchHistory` (~28), `AddToScreen` (~24), `ScoreboardEditor` (~22), `WorkspaceHeader` (~22), `ReadyMatch` (15), `PhoneControl` (14), `WorkspaceBrand`, `BoardPreview`, `PlayerAvatar` (1 cada) · namespace `workspace`

Cuidados específicos:

- **Enum de posição do overlay** (`ScoreboardEditor.tsx:175-181`): o label é hoje derivado do valor persistido por `p.replace("-"," ")`. Precisa de **4 chaves explícitas**; o `value={p}` fica cru.
- **Plural em `MatchHistory.tsx:62-63`**: `{n} match / matches` mais uma cláusula opcional de pesquisa. Uma mensagem ICU com `plural`, não concatenação.
- **Cabeçalhos de tabela** `TB`/`PTS` (`MatchHistory.tsx:138-140`) são abreviaturas em colunas estreitas — pt/it/es não abreviam igual. Marca-as para revisão de largura.
- `MatchAnalytics` e os 4 componentes de 1 string são **server components** — `getTranslations()`.

- [ ] **Step 1: Extrair, copiar, verificar, commit**

---

### Task 8: Extrair o operador e o studio (~113 strings)

**Files:** `Operator.tsx` (~44), `BroadcastGuide.tsx` (~50), `BrowserStudio.tsx` (~19) · namespaces `operator`, `studio`

O `BroadcastGuide` é o mais traiçoeiro do plano:

- `:28-29` — os itens das checklists **são as chaves do estado** (`checks.includes(item)`). Traduzir muda a identidade do estado. Passa a indexar por id estável.
- `:40` — `key={label}` do React, mesmo problema.
- `:44-48` — `value` (`youtube`/`other`/`practice`) é **persistido em localStorage**. Não se traduz.
- `:56,61,70,73` — frases construídas por fragmentos ("your YouTube channel" vs "your destination"). **Reescreve como frases inteiras por ramo**, não como concatenação — a ordem das palavras muda por língua.

- [ ] **Step 1: Extrair, copiar, verificar, commit**

---

### Task 9: Traduzir pt-BR, italiano e espanhol

Mesmas regras das fases anteriores — ver a secção "Regras de tradução" do [plano da Fase 2](2026-09-22-padelboard-i18n-phase-2.md).

**Agora também: os labels de UI citados no `/help` passam a ser traduzidos**, porque os botões reais passaram a estar traduzidos. São ~40 referências nas três línguas, listadas no relatório da Task 7 da Fase 2. Os dois têm de mudar **no mesmo commit**, ou as instruções ficam a apontar para botões que já não existem com esse nome.

- [ ] **Step 1: pt-BR, verificar, commit**
- [ ] **Step 2: Italiano, verificar, commit**
- [ ] **Step 3: Espanhol, verificar, commit**

Os testes de paridade de chaves e de preservação de placeholders apanham os enganos.

---

### Task 10: Verificação

- [ ] **Step 1:** `npm test` e `npx tsc --noEmit`
- [ ] **Step 2:** `npm run build:cloudflare`
- [ ] **Step 3:** Preview em workerd, e percorrer o **fluxo completo autenticado numa só língua**: login → dashboard → criar board → workspace → marcar pontos → desfazer → terminar → insights → histórico.
- [ ] **Step 4:** **Abrir um overlay publicado real** e confirmar que pinta. É a verificação que ficou por fechar nas fases anteriores.
- [ ] **Step 5:** Confirmar que o `/help` e os botões reais dizem o mesmo.

## Definition of done

- [ ] `npm test` passa, incluindo paridade de chaves, placeholders e códigos de erro
- [ ] `npm run build:cloudflare` completa
- [ ] O fluxo autenticado completo funciona numa língua, do login ao fim da partida
- [ ] Nenhuma chave crua nem código de erro cru visível
- [ ] Datas no formato do locale; pesquisa encontra por mês em inglês **e** na língua ativa
- [ ] `/overlay/[code]` de uma partida real continua a pintar
- [ ] Os labels no `/help` correspondem aos botões reais

## Fora de âmbito

**Fase 4**, bloqueada até validação do glossário: `src/lib/scoreboard-labels.ts` (8 avisos + 5 labels de ponto), `StatusBadges.tsx`, `locale` em `matches.overlay`, seletor de língua no editor de placar, e o seletor no `WorkspaceHeader`.
