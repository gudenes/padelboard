# Padelboard — seletor de língua (design)

**Data:** 2026-09-22
**Estado:** aprovado, por implementar
**Depende de:** [`2026-09-22-padelboard-i18n-design.md`](2026-09-22-padelboard-i18n-design.md) (Fases 1 e 2 concluídas)

## Problema

As Fases 1 e 2 deixaram a app a falar quatro línguas, mas sem forma de trocar. Quem cai em `/es` porque o browser pediu espanhol não tem saída a não ser editar o URL à mão. Quem partilha um link `/pt/m/abc` com um amigo italiano entrega-lhe português.

A negociação automática cobre a primeira visita. Não cobre o caso em que ela acerta na língua errada — um brasileiro a usar um portátil configurado em inglês, um clube espanhol cujo staff prefere inglês, alguém a testar como a transmissão aparece noutra língua.

## Âmbito

**Dentro:** um seletor nas três páginas públicas — home, manifesto e help; persistência por cookie; persistência no perfil para utilizadores autenticados, aplicada no login.

> **Atenção: são dois headers, não um.** A home e o `/manifesto` usam o
> `PublicHeader`. O `/help` tem header próprio, e ainda por cima em duas
> variantes: `WorkspaceHeader` quando há sessão, e um `<header className="pbw-nav">`
> inline quando não há. O chip entra no `PublicHeader` **e** na variante
> anónima do `/help`. A variante autenticada fica de fora, pela mesma razão
> que o workspace fica de fora.

**Fora:** o `WorkspaceHeader` da app autenticada — a UI do workspace só é traduzida na Fase 3, e um seletor que troca para italiano num ecrã que continua inglês parece avariado. Entra quando houver o que trocar.

## Decisões

| Decisão | Escolha |
|---|---|
| Colocação | `PublicHeader`, entre a navegação e o CTA "Entrar" |
| Forma | Pílula compacta com o código da língua (`PT`), painel a abrir |
| Bandeiras | Não |
| Nomes das línguas | Sempre na própria língua, nunca traduzidos |
| Preferência de perfil | Escrita pelo seletor, **lida no `/auth/callback`**, não no `proxy.ts` |

### Porquê sem bandeiras

Língua não é país. O espanhol serve Espanha e toda a América Latina; qualquer bandeira exclui alguém. Misturar uma bandeira do Brasil — que até seria correta, porque o conteúdo é pt-BR — com uma de Espanha, que não é, produz um conjunto incoerente. Acresce que as bandeiras em emoji não renderizam no Windows.

### Porquê a pílula com código

O header já tem wordmark, três links e um CTA. Em mobile está apertado. Um código de duas letras é o controlo mais estreito que continua a ser legível, e escala para mais línguas sem reflow — ao contrário de mostrar os quatro códigos lado a lado, que quebra a partir de cinco.

O painel aberto usa as linhas do placar: fundo `--pb-black`, linha ativa em `--pb-yellow`. É o motivo que o wordmark já carrega no `6/4`. O seletor passa a parecer parte do produto em vez de um controlo genérico.

### Porquê os nomes não são traduzidos

Quem precisa do seletor é precisamente quem está numa língua que não percebe. Se a lista disser "Portoghese, Inglese, Spagnolo" a um brasileiro perdido em italiano, não o ajuda. Os nomes aparecem sempre na própria língua: `English`, `Português`, `Italiano`, `Español`.

Consequência de arquitetura: **os nomes não entram nos ficheiros de mensagens.** Se lá estivessem, seriam traduzidos pelo processo normal e o seletor deixava de servir o seu propósito. Vivem em `src/i18n/routing.ts`, ao lado dos locales, como fonte única — o mesmo padrão do `hreflangByLocale`.

## 1. O componente

`src/components/i18n/LanguageChip.tsx`, cliente.

Estado fechado: pílula com borda de 2px em `--pb-black`, fundo transparente, o código da língua ativa e um chevron.

Estado aberto: painel ancorado à direita, `--pb-black`, uma linha por língua. Cada linha mostra o nome na própria língua à esquerda e o código à direita. A linha ativa tem fundo `--pb-yellow` e texto preto.

### Troca de língua

Usa o `usePathname` e o `useRouter` de `@/i18n/navigation`. O `usePathname` do next-intl devolve o caminho **sem** prefixo:

```tsx
const pathname = usePathname()   // "/help", não "/it/help"
const router = useRouter()
router.replace(pathname, { locale: next })
```

Quem está em `/it/help` vai para `/pt/help`, não para a home. É o detalhe que separa um seletor útil de um irritante, e é a razão para não construir o URL à mão.

O `router.replace` do next-intl escreve o cookie `NEXT_LOCALE` — nível 2 da precedência do spec de i18n.

### Acessibilidade

- Botão com `aria-expanded`, `aria-haspopup="listbox"` e `aria-controls`
- Painel com `role="listbox"`; cada opção `role="option"` com `aria-selected`
- `Escape` fecha e devolve o foco ao botão; setas cima/baixo navegam; `Home`/`End` saltam para as pontas
- Clique fora fecha
- Cada nome leva o seu `lang`: `<span lang="pt">Português</span>`, para o leitor de ecrã pronunciar cada um na língua certa em vez de ler tudo com a fonética da página
- O botão tem um `aria-label` traduzido (`common.languageAria`, "Change language") — este **é** traduzido, porque descreve a ação, não nomeia uma língua

## 2. Persistência

### Cookie

Escrito pelo `router.replace`. Cobre o caso normal: mesma pessoa, mesmo dispositivo.

### Perfil — e a divergência face ao spec de i18n

O spec de i18n (§2) define cinco níveis de precedência e põe a preferência de perfil no nível 3, entre o cookie e o `Accept-Language`. Não diz, porém, **quem lê** esse nível.

Lê-lo no `proxy.ts` obrigaria a autenticar contra o Supabase em cada pedido de UI. Isso põe uma ida à rede no caminho crítico de todas as páginas, dentro do middleware que o próprio spec (§6) identifica como a peça experimental e não mantida em Cloudflare Workers. O custo recai sobre todos os pedidos para servir uma minoria — utilizadores autenticados em dispositivos novos.

**Em vez disso, a preferência é aplicada no `/auth/callback`.** Essa rota já corre autenticada e já lê `user_metadata.padelboard_profile`. Passa a, antes de redirecionar, escrever o cookie `NEXT_LOCALE` a partir de `padelboard_profile.locale`. Os redirects existentes continuam sem prefixo (`/dashboard`, `/welcome`, `/m/<code>`) e o `proxy.ts` prefixa-os com base no cookie acabado de escrever.

Resultado idêntico entre dispositivos, custo zero nos pedidos normais. O nível 3 deixa de ser um degrau na função de precedência e passa a ser uma escrita de cookie no momento do login — que é, na prática, o mesmo comportamento observável.

### Validação

`parsePlayerProfile()` em `src/lib/player-profile.ts` ganha um campo `locale` **opcional**. Tem de ser opcional: os perfis já gravados não o têm, e a função lança em campo inválido. Um `locale` ausente ou fora de `routing.locales` é ignorado, não é erro — a preferência de língua não deve impedir alguém de guardar o perfil.

Sem migration. O `padelboard_profile` vive em `user_metadata`.

## 3. Testes

1. **`localeNames` tem exatamente uma entrada por locale** — mesmo padrão do teste que já existe para `hreflangByLocale`. Acrescentar uma língua sem lhe dar nome passa a falhar.
2. **Os nomes das línguas não estão nos ficheiros de mensagens** — falha se alguém puser `English`/`Português`/`Italiano`/`Español` como valor em `src/messages/*.json`. É o teste que protege a decisão de não os traduzir, que de outra forma seria só um comentário que alguém apaga.
3. **`parsePlayerProfile` aceita um perfil sem `locale`** e rejeita um `locale` fora do conjunto suportado sem lançar.

A troca de caminho (`/it/help` → `/pt/help`) é comportamento do `useRouter` do next-intl, não nosso. Testá-la seria testar a biblioteca. O que se testa é que o componente chama `replace` com o pathname sem prefixo, não com um URL construído à mão.

## Fora de âmbito

- Seletor no `WorkspaceHeader` — Fase 3
- Língua do placar (`matches.overlay.locale`) — Fase 4, com o glossário validado
- Deteção de discrepância ("o teu browser está em espanhol, queres trocar?") — ruído antes de haver sinal de que é preciso
