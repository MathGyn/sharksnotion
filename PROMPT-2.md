# Relatórios da Esteira de Demandas — Sharks Imobiliária

## Como usar este documento

Ele está em ordem de prioridade: **direção de design primeiro**, porque é onde a entrega costuma falhar. Só depois vêm dados e regras. Nada aqui é sugestão; cada valor é uma decisão tomada.

O padrão de qualidade é este: se a tela puder ser confundida com qualquer dashboard genérico de template, ela está errada e precisa ser refeita.

---

# 1. Conceito

Isto **não é um dashboard de SaaS**. É o **relatório mensal impresso de uma agência**, que por acaso vive no navegador. A referência mental é um anuário de resultados bem diagramado, não um painel de métricas com cards cinzas.

O processo do cliente se chama "esteira": as demandas andam de mão em mão até serem entregues. O relatório **não** mostra esse movimento dia a dia nem entregas individuais — é um **relatório mensal de volume**, organizado por pessoa.

Público: o dono da imobiliária e a diretoria de marketing. Eles querem saber, em trinta segundos, quanto o time entregou no mês, quem mais produziu, para quais departamentos, que tipos de material, e se foi no prazo.

---

# 2. Design system

## 2.1 Cores

Marca da Sharks Imobiliária: azul marinho e areia.

```
--marinho:       #10203F   /* títulos, números, pílula ativa, botões */
--marinho-fumo:  #3A4D70   /* texto secundário, rótulos de apoio */
--areia:         #B8A27A   /* destaque único da tela */
--areia-clara:   #EDE5D6   /* preenchimento suave */
--papel:         #EFEDE7   /* fundo da página */
--branco:        #FFFFFF   /* blocos */
--nevoa:         #DCE0E8   /* preenchimento suave frio */
--linha:         #E3E0D8   /* bordas de 1px */
--atraso:        #A8402F
--no-prazo:      #2F6B4F
```

Cor das pessoas (atribuída por ordem alfabética, fixa):
`#10203F`, `#B8A27A`, `#6D7F9E`, `#8C7651`, `#3A4D70`, `#A8A29A`

Regras: tema **claro apenas**, sem alternador de tema. Zero gradiente. Cor só onde carrega significado — categoria, pessoa, prazo. O `--areia` aparece **uma vez por tela**, no **card da pessoa que mais entregou no período** (visão geral); se aparecer em dois lugares, perdeu a função.

## 2.2 Tipografia

Família única: **Archivo** (Google Fonts, variável, com eixo de largura), carregada por `next/font`. Ela conversa com o logo da Sharks, que é geométrico e espaçado.

- Números grandes e título do mês: **Archivo Expanded**, peso 600, tracking `-0.02em`
- Interface e texto corrido: Archivo largura normal, pesos 400 e 500
- Todos os números: `font-variant-numeric: tabular-nums`

Escala, em px: 12 / 14 / 16 / 20 / 26 / 40 / 64 / 96.
Altura de linha: 1.2 em títulos, 1.5 em texto.

Proibido: rótulo em caixa alta, texto em caixa alta em qualquer lugar que não seja o logo, itálico decorativo, destacar uma palavra do título em outra cor.

## 2.3 Espaço, forma e profundidade

- Escala de espaço: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
- Largura máxima de conteúdo: 1240px, grade de 12 colunas, medianiz de 24px
- Raio: 28px nos blocos grandes, 12px em elementos internos, pílula total em botões, filtros e etiquetas. **Nunca o mesmo raio em tudo** — a diferença de raio é o que marca hierarquia
- Profundidade vem de **preenchimento de cor e borda de 1px em `--linha`**, não de sombra. Uma única sombra em toda a aplicação, no **seletor de período** quando ele estiver grudado no topo: `0 8px 24px rgba(16,32,63,.08)`

## 2.4 Movimento

Sem animação de entrada em blocos ou listas. Hover e clique respondem em 120ms. Respeitar `prefers-reduced-motion`.

## 2.5 Texto da interface

Português do Brasil, frase normal, verbo direto. "Baixar PDF", não "Exportar relatório em formato PDF". Estados vazios dizem o que fazer: "Nenhuma entrega em outubro ainda. As movimentações aparecem aqui assim que os cards andarem na Esteira."

---

# 3. Componentes assinatura

## 3.1 Indicadores do time

Quatro números, em linha, **sem card em volta** — só o número em Archivo Expanded 64px e o rótulo embaixo em 14px `--marinho-fumo`, separados por uma linha vertical de 1px em `--linha`. Na visão do time: total concluídas, % no prazo, lead time médio, total de ajustes.

## 3.2 Cards de pessoa (visão geral)

Grade responsiva de **cards** (3 colunas desktop, 2 tablet, 1 celular), ordenados da **maior** para a **menor** quantidade de entregas no período. Cada card: avatar com iniciais, nome, entregas em **Archivo Expanded 64px**, abaixo tempo médio e **% no prazo** em texto pequeno (`--marinho-fumo`). O **card inteiro é clicável** e leva a `/pessoa/[slug]` preservando `de`/`ate`. Quem mais entregou no período: card preenchido em `--areia` com texto `--marinho` — **único** uso de areia na tela.

## 3.3 Listas de contagem

Duas colunas lado a lado na visão do time; mesma estrutura na visão da pessoa (recortada pelas entregas dela no período):

- **Para quem** — departamento da solicitação vinculada (`Solicitacao.departamento` via `Demanda.solicitacaoDeOrigemId`); sem vínculo → `"Sem vínculo"`
- **Tipo de material** — `Demanda.tipoConteudo`

Cada item: nome à esquerda, número à direita (tabular-nums), ordenado do maior para o menor. **Cada linha é clicável** e abre a lista de demandas com o filtro correspondente (mais período atual; mais `pessoa` se estiver na visão da pessoa). **Lista de texto**, não gráfico.

## 3.4 Cabeçalho do relatório

Logo Sharks, **seletor de período** (presets + intervalo personalizado; rótulo por extenso), botão "Baixar PDF". O par `de`/`ate` acompanha **toda** navegação (visão geral, pessoa, demandas, detalhe). Na **visão da pessoa**, fileira de **pílulas**: "Visão geral" + uma pílula por pessoa com entrega no período (ativa = pessoa atual).

## 3.6 Seletor de período

Presente em todas as telas web (níveis 1–3). Opções: **este mês**, **mês passado**, **últimos 3 meses**, **este ano**, **intervalo personalizado** (duas datas). Canon interno: `?de=AAAA-MM-DD&ate=AAAA-MM-DD`. O legado `?mes=AAAA-MM` continua aceito e é **convertido** para o primeiro e último dia daquele mês em São Paulo. Nunca oferecer intervalo com fim no futuro. Rótulo visível: por extenso (ex.: "1 a 30 de setembro de 2026").

## 3.7 Lista de demandas (nível 2)

Rota `/r/[chave]/demandas`. Filtros combináveis via querystring: `pessoa`, `departamento`, `tipo`, `de`, `ate` (slugs sem acento, minúsculas). Cabeçalho: **pílulas removíveis** (X tira o filtro e recarrega mantendo os demais + período), total encontrado, lista. Cada item: título, tipo, pessoa que entregou, departamento, data de conclusão, situação (no prazo / atraso / sem prazo); linha clicável → detalhe da demanda. **Breadcrumb** no topo preservando período.

## 3.8 Detalhe da demanda (nível 3)

Rota `/r/[chave]/demanda/[id]`. Campos do card + solicitação vinculada (quando houver). Histórico cronológico: uma linha por movimentação (data/hora, para onde foi, status naquele momento, duração da passagem encerrada). Demandas anteriores a **21/09/2026** sem movimentação: mensagem "Esta demanda é anterior ao registro de movimentações". Link "Abrir no Notion". **Breadcrumb** preservando período e filtros da lista.

## 3.5 Indicadores da pessoa

Mesmo padrão visual dos indicadores do time (3.1), quatro números sem caixa: entregas da pessoa, tempo médio dela, % no prazo dela, ajustes dela.

---

# 4. Telas

Tudo alinhado à esquerda. Nada centralizado. **Nível 1:** volume agregado. **Níveis 2–3:** drill-down. Query `de`/`ate`; `?mes=` convertido; filtros persistem.

## 4.1 Visão do time — `/r/[chave]?de=…&ate=…`

```
[logo Sharks]                                  [setembro de 2026 ▾]  (Baixar PDF)

Entregas de setembro

42              │  86%              │  5,2 dias            │  7
concluídas      │  no prazo         │  lead time médio      │  ajustes

▓ MS  Matheus        12 entregas     1,4 dia médio          ← linha areia = quem mais entregou
  MZ  Mizael           9 entregas     2,1 dias
  PG  Perdigão         8 entregas     0,9 dia
  ...

Para quem                          Tipo de material
Vendas Digitais               16   Vídeo                     18
Sec Vendas                     9   Design                    12
Sem vínculo                    3   Fotos                      6
```

- Título: **Entregas · {rótulo do período}**.
- Indicadores (3.1), grade de **cards** de pessoa (3.2), listas clicáveis (3.3) → `/demandas?…` com `de`/`ate`.

## 4.2 Visão da pessoa — `/r/[chave]/pessoa/[slug]?de=…&ate=…`

```
[logo Sharks]                                  [setembro de 2026 ▾]  (Baixar PDF)

Matheus · setembro de 2026

12              │  1,4 dias         │  92%                 │  2
entregas        │  tempo médio      │  no prazo            │  ajustes

Para quem                          Tipo de material
(recorte das entregas dela)        (recorte das entregas dela)
```

- Pílulas (3.4), título **`{Nome} · {rótulo do período}`**, indicadores (3.5), listas recortadas; cliques incluem `pessoa=[slug]` na query de demandas.

## 4.3 Lista de demandas — `/r/[chave]/demandas?…`

Conteúdo (3.7). Breadcrumb nível 2.

## 4.4 Detalhe da demanda — `/r/[chave]/demanda/[id]?…`

Conteúdo (3.8). Breadcrumb nível 3; mesma query ao voltar à lista.

## 4.5 Versão para PDF — `/r/[chave]/imprimir?de=…&ate=…` e `/r/[chave]/imprimir/pessoa/[slug]`

**Somente nível 1.** A4, fundo branco, sem seletor de período. **Não** imprimir demandas. `window.print()` + `.no-print`.

## 4.6 Logo

`public/sharks-logo.svg`, versão marinho. Se o arquivo não existir, escrever "Sharks Imobiliária" em Archivo 600 até ele chegar.

## 4.7 Definições de métricas (telas)

- **Período:** intervalo inclusivo `[de, ate]` em `America/Sao_Paulo` (datas `AAAA-MM-DD` + instantes ISO para conclusão e fim de passagem).
- **Entrega da pessoa:** passagem encerrada dentro do intervalo.
- **% no prazo (card e visão pessoa):** sobre demandas cujas passagens da pessoa terminaram no intervalo.
- **Departamento ("Para quem"):** `Solicitacao.departamento`; sem vínculo → `"Sem vínculo"`.
- **Lead time médio (time):** demandas concluídas no intervalo com solicitação vinculada.
- **Lista de demandas:** demandas **concluídas no intervalo** que satisfazem filtros; "pessoa que entregou" = quem encerrou a última passagem da demanda no intervalo (regra pura em `lib/relatorio/filtros-demandas.ts`).

---

# 5. O que não fazer

Estes são os padrões que tornam a tela genérica. Se algum aparecer, refazer:

- Cards brancos genéricos iguais para tudo (exceto os **cards de pessoa** da seção 3.2, que são assinatura)
- Indicadores dentro de caixinhas com borda
- Fonte Inter, Roboto ou a padrão do shadcn; componente shadcn usado sem nenhum ajuste de estilo
- Sidebar escura à esquerda com ícones
- Gráfico de pizza, rosca, área com gradiente, barras de biblioteca (Recharts ou similar) ou qualquer “chart” para contagens — usar **lista nome + número**
- Emoji como ícone
- Rótulo em caixa alta acima de cada bloco, meta-informação separada por ponto médio ("Vídeo · Marista · 12/09"), seta "→" no fim de botão
- Alternador de tema claro/escuro
- Animação de entrada em cada bloco ao rolar a página
- Saudação do tipo "Bem-vindo de volta" ou "Olá 👋"

---

# 6. Fonte de dados (Notion)

O próprio Notion é o banco. **Não usar Supabase nem qualquer outro banco.** A aplicação só lê.

Nomes de propriedade são exatos, com acento e **espaço no final** onde indicado.

## 6.1 Esteira de Demandas — `1af2f1ec-ec89-8168-a97e-000b54ea5304`

| Propriedade | Tipo | Observação |
|---|---|---|
| `Solicitação` | title | nome da demanda |
| `Está com` | select | coluna do kanban: mistura pessoas e etapas |
| `Status` | status | Não iniciado, Aguardando Retorno, Em andamento, Ajustes, Aprovação, Concluído, Cancelado |
| `Tipo de Conteúdo` | select | Vídeo, Fotos, Design, Briefing, Administrativo, INTERNO |
| `Urgência` | select | Alta, Média, Baixa |
| `Responsável` | people | |
| `Precisa entregar até ` | date | **espaço no final do nome** |
| `Data De entrega` | date | preenchida à mão, nem sempre |
| `Data gravação / edição` | date | |
| `Solicitação de Origem` | relation | até 1 página; cards antigos podem não ter |
| `Histórico` | relation | páginas em Movimentações |

## 6.2 Solicitações ao MKT — `ac6dbaf1-6cc6-4e1b-a3ab-4c3d587d8940`

| Propriedade | Tipo |
|---|---|
| `Titulo` | title (sem acento) |
| `Departamento` | select: RH, Sec Vendas, Vendas Digitais, Financeiro, GI |
| `Unidade/Loja` | select: MARISTA, JARDIM GOIÁS, BUENO, TODAS |
| `Solicitante` | people |
| `Data da Solicitação` | date |
| `Prazo Desejado` | date |
| `Estimativa de entrega ` | date (**espaço no final**) |
| `Canal de uso ` | select (**espaço no final**) |
| `Objetivo do material` | select |
| `Demanda na Esteira` | relation |

Ignorar fórmulas, rollups e botões dessa base.

## 6.3 Movimentações da Esteira — `0b2bfe8c-0dad-4345-897f-74c9657d9594`

Gerada automaticamente quando um card é criado ou quando muda `Está com` ou `Status`.

| Propriedade | Tipo | Observação |
|---|---|---|
| `Registro` | title | nome do card no momento |
| `Demanda` | relation | pode vir vazia (card apagado): descartar a linha |
| `Para` | rich_text | valor de `Está com` no momento |
| `Status` | rich_text | valor de `Status` no momento |
| `Quando` | created_time | momento da movimentação |

O histórico começa em **21/09/2026**. Antes disso não existe movimentação.

## 6.4 Leitura

- Leitura só no servidor. O token nunca vai para o navegador
- Buscar as três data sources com paginação de 100, requisições **em sequência**, nunca em paralelo
- Limite da API: 3 requisições por segundo. Em 429, respeitar `Retry-After` e repetir
- SDK `@notionhq/client` na versão mais recente, usando `dataSources.query` (a API de data sources, não `databases.query`)
- Cache de 10 minutos. `POST /api/revalidate` protegida por `REVALIDATE_SECRET` força atualização

---

# 7. Regras de negócio

**Pessoa vs. etapa no `Está com`:** etapas são `Não iniciado`, `Aprovação`, `Cancelados` e qualquer valor que comece com `Concluído` (existe "Concluído - Setembro"). Todo o resto é pessoa. Derivar a lista dos dados, nunca fixar nomes no código. Comparação sempre sem diferenciar maiúsculas (há registros antigos com "MATHEUS"). Essa decisão mora numa função única em `lib/relatorio/classificacao.ts`; nenhum outro arquivo reimplementa isso.

**Passagem:** para cada demanda, ordenar as movimentações por `Quando`. A passagem por X começa na primeira linha com `Para = X` e termina na próxima linha com `Para ≠ X`. Linhas em que só o status mudou pertencem à mesma passagem.

**Entrega de uma pessoa no intervalo:** passagem com `saida` dentro do intervalo `[de, ate]` (inclusivo, fuso SP).

**Demanda concluída no intervalo:** instante de conclusão (regra abaixo) cai dentro do intervalo. Agregações e filtros recebem `{ de, ate }`, não um mês isolado.

**Demanda concluída (instante):** primeira movimentação com `Status = Concluído` dentro do intervalo consultado para listagens; regra global de conclusão inalterada para cálculo do instante. Sem histórico, usar `Data De entrega` como alternativa.

**No prazo:** data de conclusão ≤ `Precisa entregar até `. Sem prazo = "sem prazo", fora do percentual.

**Retrabalho:** número de vezes em que o status entrou em `Ajustes` vindo de outro status.

**Lead time:** de `Data da Solicitação` (ou, se vazia, a criação da solicitação) até a conclusão. Só para demandas com solicitação vinculada.

**Tempo com a pessoa:** média das durações das passagens, em horas corridas, exibida em dias com uma casa decimal.

**Métricas na visão da pessoa:** entregas = passagens encerradas no intervalo; tempo médio e % no prazo como antes, recortadas ao intervalo.

**Contagens agregadas:** conjunto de demandas definido pelo recorte (concluídas no intervalo no time; passagens da pessoa no intervalo na visão pessoa). Implementação **só** em `lib/relatorio/agregacoes.ts` e módulos de filtro — **componentes não filtram nem contam**.

**Drill-down:** slugs estáveis (`departamento=sec-vendas`, `tipo=video`, `pessoa=matheus`). Resolver slug → rótulo canônico no servidor.

---

# 8. Decisões técnicas já tomadas

Estrutura de pastas: `app/r/[chave]/` com `page.tsx`, `pessoa/[slug]/page.tsx`, `demandas/page.tsx`, `demanda/[id]/page.tsx`, `imprimir/`; `lib/notion/`; `lib/relatorio/` (classificacao, passagens, conclusoes, indicadores, tempo, retrabalho, **periodo.ts**, **agregacoes.ts**, **filtros-demandas.ts**, **detalhe-demanda.ts**, slugs de departamento/tipo); `components/relatorio/` (cabeçalho, período, indicadores, **grade de cards**, listas clicáveis, breadcrumb, chips de filtro, lista e detalhe de demandas); `mocks/`; `__tests__/`.

1. **Cache antes de normalizar.** Cachear a resposta crua do Notion e normalizar depois. O cache serializa em JSON e `Date` viraria string.
2. **Datas como texto.** Campos de data sem hora ficam como `"AAAA-MM-DD"` (`type DataISO = string`), nunca `Date`. Timestamps ficam como ISO completo. Converter para `Date` só dentro das funções de cálculo.
3. **Fuso `America/Sao_Paulo`** em toda comparação, recorte de intervalo e agrupamento. Um prazo "2026-09-23" com conclusão às 22h de 23/09 em São Paulo é "no prazo".
4. **`criadoEm: string`** em `Demanda` e em `Solicitacao` (created_time), usado como alternativa no lead time.
5. **Slug sem acento** nas rotas de pessoa (`/pessoa/perdigao`), com função em `lib/utils` que converte nome em slug e resolve de volta.
6. **`app/r/[chave]/layout.tsx`** valida a chave uma vez e chama `notFound()` se errada. `noindex, nofollow` no metadata raiz.
7. **Vitest**, sem Testing Library. Só funções puras.

Stack: Next.js App Router, TypeScript, Tailwind, date-fns e date-fns-tz. **Sem Recharts** — distribuições são listas de texto. Sem banco, sem autenticação. Precisa rodar na Netlify ou na Vercel sem configuração especial.

`.env.example`:
```
NOTION_TOKEN=
REPORT_ACCESS_KEY=
REVALIDATE_SECRET=
```

---

# 9. Dados de exemplo (obrigatório)

O token do Notion ainda não existe. Se `NOTION_TOKEN` não estiver definido, `lib/notion/` lê de `mocks/` no **mesmo formato de resposta da API do Notion** (páginas com `properties`), para que a troca pelo real não mude nada fora dessa camada.

~40 cards, ~25 solicitações, ~150 movimentações entre 01/08/2026 e 30/09/2026, com as pessoas, tipos, departamentos e unidades reais listados acima. Incluir: card que voltou para Ajustes duas vezes, card com dois donos em sequência, card sem solicitação vinculada, card sem prazo, card concluído com atraso, linha de movimentação com `Demanda` vazia, valor "MATHEUS" em maiúsculas, coluna "Concluído - Setembro".

---

# 10. Ordem de execução

1. Camada de dados e mocks
2. Regras de negócio com testes (um teste por caso difícil da lista acima, mais o teste de fuso)
3. Design system em `globals.css` e `tailwind.config.ts` (tokens exatos da seção 2) + primitivos em `components/ui/`
4. Período (`periodo.ts`) e agregações por intervalo + testes (incl. intervalo cruzando dois meses)
5. Filtros e listagem/detalhe de demandas (`filtros-demandas.ts`, `detalhe-demanda.ts`) + testes
6. Componentes e telas (cards, drill-down, breadcrumb, seletor de período)
7. Versão para PDF — **apenas** nível 1 (A4)

Parar ao fim de cada etapa e mostrar um resumo curto.

Antes da etapa 5, comparar o que foi construído com a seção 5 deste documento, item por item, e dizer o que foi ajustado.

# 11. Critérios de aceite

- `npm run dev` sobe com os mocks, exigindo apenas `REPORT_ACCESS_KEY`
- Visão geral, pessoa, lista e detalhe de demandas funcionam com mocks; filtros persistem ao navegar e voltar
- PDF só para visão geral e pessoa
- Testes do `lib/relatorio/` passando
- Nenhum item da seção 5 presente na interface
- README curto: como rodar e como trocar para o Notion real
