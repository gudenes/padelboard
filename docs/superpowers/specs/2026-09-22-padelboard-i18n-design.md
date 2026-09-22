# Padelboard i18n — design

**Data:** 2026-09-22
**Estado:** aprovado, por implementar
**Línguas alvo:** inglês (atual, default), português do Brasil, italiano, espanhol

## Problema

O Padelboard está inteiramente em inglês e não tem qualquer infraestrutura de i18n:
sem `next-intl`, sem `messages/`, sem middleware, com `<html lang="en">` fixo em
`src/app/layout.tsx:17`. Os mercados de padel que interessam ao produto — Brasil,
Itália, Espanha — são precisamente os que não estão cobertos.

O trabalho abrange ~44 ficheiros `.tsx` com copy visível, ~24 mensagens de erro nas
rotas de API, as validações de `src/lib/player-profile.ts`, os nomes e descrições dos
templates (`src/lib/templates/*.tsx`) e dos board styles (`src/lib/board-styles.ts`),
e as ~15 labels do placar em `src/lib/scoreboard-labels.ts`.

## Âmbito

Dentro: todas as superfícies de UI, incluindo o placar de OBS.

Fora: os emails de magic link. São renderizados pelos templates do Supabase,
configurados no dashboard, não existem neste repositório. Traduzi-los é trabalho
Supabase-side e fica para um spec próprio.

## Decisões

| Decisão | Escolha |
|---|---|
| Biblioteca | `next-intl` 4.14+ (peer declara `next ^16.0.0`; o repo está em 16.3.5) |
| Routing | segmento `[locale]`, `localePrefix: 'as-needed'` — inglês sem prefixo |
| Variante de português | pt-BR (conteúdo), código de locale `pt` (URL), `hreflang="pt-BR"` |
| Língua do placar | por jogo, guardada em `matches.overlay.locale` |
| Tradução | escrita por Claude; revisão de pt-BR por Gustavo |

## 1. Forma das rotas

Movem-se para `src/app/[locale]/`:

`/`, `/manifesto`, `/help`, `/login`, `/welcome`, `/dashboard`, `/dashboard/new`,
`/dashboard/profile`, `/m/[code]` e sub-rotas (`edit`, `insights`, `studio`, `remote`).

Ficam fora do `[locale]`, deliberadamente:

| Rota | Razão |
|---|---|
| `/overlay/[code]` | URL colado como Browser Source no OBS. Um prefixo partiria os placares em uso. A língua vem da BD, não do URL. |
| `/api/*` | Sem UI. Erros traduzidos por `Accept-Language`. |
| `/auth/callback` | Redirect registado no dashboard do Supabase; tem de ficar estável. |

URLs resultantes: `/help`, `/pt/help`, `/it/help`, `/es/help`.

### Código de locale vs hreflang

O URL usa `pt`; o `<head>` declara `hreflang="pt-BR"`. O conteúdo é brasileiro, mas
`/pt-BR/...` é ruído num link partilhado. Se pt-PT entrar algum dia, separa-se então.

### Compatibilidade de links

Links `/m/[code]` já partilhados passam a ter prefixo. O `proxy.ts` emite um 307 do
caminho sem prefixo para a língua detetada. Nenhum link existente parte.

## 2. Resolução de língua

Precedência, do mais forte ao mais fraco:

1. **Prefixo no URL** — ganha sempre. `/it/m/abc` abre em italiano mesmo numa conta pt-BR.
2. **Cookie `NEXT_LOCALE`** — escrito pelo seletor de língua.
3. **Preferência do perfil** — utilizadores autenticados; lida do `user_metadata`
   (`padelboard_profile`), já escrito em `src/app/api/profile/route.ts`. Sem migration:
   estende-se o validador `parsePlayerProfile()` em `src/lib/player-profile.ts`.
4. **`Accept-Language`** — primeira visita, negociado contra `['en','pt','it','es']`.
5. **`en`** — fallback.

Ao mudar de língua, um utilizador autenticado escreve nos **dois** sítios: cookie e
perfil. Só cookie perde-se ao trocar de dispositivo; só perfil deixa o visitante
anónimo sem preferência.

A função de precedência vive isolada e testável em `src/lib/locale.ts`, e não depende
do runtime de Next — recebe os inputs (pathname, cookie, perfil, header) e devolve o
locale.

## 3. Placar (overlay)

`matches.overlay` já é jsonb, tipado em `src/types/match.ts`; ganha um campo `locale`.
Default no momento de criação do jogo: a língua da conta do operador. Seletor exposto
no editor do placar, junto das restantes opções de board.

`/overlay/[code]` mantém-se sem prefixo, lê `overlay.locale` do registo e carrega
**apenas o namespace `scoreboard`**. O overlay corre durante horas dentro do encoder do
cliente; enviar-lhe o bundle completo de mensagens é custo de memória sem retorno.

### O placar é terminologia, não copy

Duas forças em tensão com a tradução literal.

**Largura.** Os slots foram desenhados para inglês e as traduções crescem:

| EN | ES | Δ chars |
|---|---|---|
| `BREAK POINT` | `PUNTO DE BREAK` | +3 |
| `MATCH COMPLETE` | `PARTIDO FINALIZADO` | +4 |
| `SUPER-TIEBREAK` | `SÚPER TIE-BREAK` | +1 |

**Convenção.** Vários destes termos são ditos em inglês por comentadores italianos e
brasileiros de padel. Traduzir à força soa amador — o oposto do que um placar de
broadcast deve transmitir.

Por isso cada um dos ~15 termos de `src/lib/scoreboard-labels.ts` e
`src/components/overlay/StatusBadges.tsx` foi decidido caso a caso, numa lista validada
com o Gustavo antes de entrar em código.

### Decidido em 2026-09-22: o placar fica em inglês

**Todos os termos do placar mantêm-se em inglês, nas quatro línguas.** Validado pelo
Gustavo depois de ver os termos e as larguras comparadas.

O raciocínio é o das duas forças acima: são termos ditos em inglês por comentadores nos
três mercados, e o espanhol — o que mais cresce — levaria `MATCH COMPLETE` de 14 para 18
caracteres (`PARTIDO FINALIZADO`), com dois avisos juntos a chegar a 31. O placar é um
grafismo de broadcast, não uma interface.

Consequências, todas simplificações:

- `src/lib/scoreboard-labels.ts` e `StatusBadges.tsx` **não precisam de i18n**
- O teste de orçamento de caracteres (§7.2) **deixa de ser necessário** — o inglês é a
  medida para que os slots foram desenhados
- **`matches.overlay.locale` deixa de ter propósito** e sai do âmbito: não há nada
  dependente de língua no overlay para guardar
- `AnimatedMatchTime` (`MATCH TIME ·`) fica inglês e **não precisa de tratamento
  especial** no caminho de render do overlay
- O overlay passa a ser inteiramente inglês, por decisão de produto

Se um dia isto se reverter, o trabalho que volta é a tradução dos ~15 termos mais o
`locale` em `matches.overlay` — não a infraestrutura, que já existe.

### Glossário de termos invariantes

Não se traduzem, em nenhuma das 4 línguas:

- **Golpes de padel (espanhol):** bandeja, víbora, bajada, chiquita, contrapared.
  São o vocabulário aceite do desporto em todos os mercados. "Bandeja" nunca vira "tray".
- **Termos de broadcast (inglês):** decididos termo a termo na lista do placar.

Hoje não há nenhuma ocorrência de nomes de golpes no código — verificado. A regra é
prospetiva: governa a copy da landing e do `/help`, que mencionam padel, e o
`/m/[code]/insights` quando vier a classificar golpes.

## 4. Mensagens

`src/messages/{en,pt,it,es}.json`, com namespaces a espelhar as áreas do produto:

`home`, `manifesto`, `help`, `auth`, `dashboard`, `wizard`, `workspace`, `operator`,
`scoreboard`, `errors`, `templates`, `boardStyles`, `metadata`.

Dois carregadores de strings que não são `.tsx` e que entram no âmbito desde o início,
porque retrofitá-los custa mais do que incluí-los:

- **`src/lib/templates/*.tsx` e `src/lib/board-styles.ts`** — `name`, `description` e
  `slots[].label` são renderizados no customizer. Passam a chaves.
- **`metadata`** — `title` e `description` por língua. Sem isto, o SEO que motivou o
  prefixo as-needed não acontece.

Chave em falta faz fallback para a string inglesa, via `getMessageFallback`. Nunca se
mostra a chave crua: um `scoreboard.matchPoint` no ecrã de um cliente é pior que inglês.

## 5. Erros de API

As ~24 mensagens das rotas em `src/app/api/**/route.ts` passam ao namespace `errors`,
resolvidas por `Accept-Language` do pedido — a rota não tem prefixo de URL de onde
deduzir língua. As validações de `src/lib/player-profile.ts` seguem o mesmo caminho.

## 6. Risco: middleware em Cloudflare Workers

O deploy é Cloudflare Workers via `@opennextjs/cloudflare`. No Next 16 o `middleware.ts`
foi substituído por `proxy.ts`, que corre no runtime Node — e o adaptador marca o
suporte a Node middleware como **experimental e não mantido pelos maintainers do
OpenNext**. A deteção de língua e o prefixo as-needed do next-intl assentam nele.

**Verificado empiricamente em 2026-09-22** com um `proxy.ts` trivial,
`npm run build:cloudflare` e preview no workerd local:

| Capacidade | Resultado |
|---|---|
| `proxy.ts` executa | ✅ header presente na resposta |
| Lê `Accept-Language` | ✅ `pt-BR,pt;q=0.9` intacto |
| `NextResponse.redirect` | ✅ 307 + `Location` correto |
| Executa em rotas dinâmicas | ✅ |

As três capacidades de que o design precisa funcionam. A ressalva mantém-se: um upgrade
de Next ou do adaptador pode parti-lo, sem garantia de suporte.

**Plano B**, se isso acontecer: `localePrefix: 'always'`, sem middleware. Todas as rotas
de UI sob `[locale]` com prefixo obrigatório, e o redirect de `/` feito num server
component que lê `Accept-Language` via `headers()`. Custa os URLs ingleses limpos e
obriga a redirects de compatibilidade mais largos, mas não depende de nada experimental.

## 7. Testes

O `vitest` já está configurado. Três testes que sustentam o sistema:

1. **Paridade de chaves** — `pt`, `it` e `es` têm exatamente as chaves de `en`. É o teste
   que evita a morte lenta deste tipo de projeto: alguém acrescenta uma string em inglês
   e as outras línguas apodrecem em silêncio.
2. **Orçamento de caracteres do placar** — cada label de `scoreboard` dentro do limite do
   seu slot, em todas as línguas.
3. **Negociação de locale** — a função de precedência da secção 2, em isolamento.

## 8. Faseamento

Cada fase deixa a app funcional.

| Fase | Conteúdo | Verificável por |
|---|---|---|
| 1 | Infra: next-intl, `proxy.ts`, `[locale]`, redirects de compatibilidade, `en.json` extraído | App inteira em inglês, a funcionar como hoje |
| 2 | Traduções pt/it/es das páginas públicas + metadata e hreflang | `/pt`, `/it`, `/es` navegáveis |
| 3 | App autenticada: dashboard, wizard, workspace, operador, erros de API | Fluxo completo numa língua |
| 4 | Placar: glossário validado, `locale` em `matches.overlay`, seletor no editor | Placar em 4 línguas no OBS |

A Fase 1 completa-se antes de qualquer tradução de propósito. Se a infraestrutura partir
em Cloudflare, isso deve descobrir-se com a app em inglês e revertível — não com 700
strings traduzidas por cima.

## Fora de âmbito

- Emails do Supabase (magic link) — spec próprio, trabalho no dashboard
- pt-PT como variante separada
- Tradução de conteúdo gerado por utilizadores (nomes de jogadores, torneios, clubes)
- Regras de formatação de datas específicas por mercado (formatos relativos, calendários
  alternativos). **Dentro** do âmbito, na Fase 3: substituir o `en-GB` fixo em
  `src/components/workspace/MatchHistory.tsx:116` e `src/lib/match-search.ts:40-41` pelo
  locale ativo.
