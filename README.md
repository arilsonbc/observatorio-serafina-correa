# Observatório Serafina

Painel cidadão de licitações, resultados homologados, contratos, pagamentos e remuneração da Prefeitura de Serafina Corrêa/RS.

## Site no GitHub Pages

Acesso público: https://arilsonbc.github.io/observatorio-serafina-correa/

O fluxo `.github/workflows/pages.yml` publica a interface e cópias dos dados públicos de 2017 em diante, sem servidor nem credenciais no navegador. Executa a cada alteração em `main`, manualmente pelo Actions e diariamente às 10h30 UTC (7h30 de Brasília; o GitHub pode atrasar a execução). A origem continua sendo a coleta municipal mantida no Observatório; o Pages não executa o coletor diretamente. A data da coleta e sua cobertura aparecem no painel. Se a cópia falhar, a publicação anterior permanece disponível.

Para gerar a versão estática: `node scripts/build-pages.mjs`. O resultado fica em `pages-output/`, fora do Git. Os perfis usam `index.html?perfil=...&id=...`, permitindo abrir e compartilhar links diretamente no subdiretório do projeto. O workflow publica apenas os arquivos necessários à interface e os dados públicos, sem os arquivos operacionais do coletor.

## Funcionalidades

- Interface responsiva, menu compacto e cartões no celular.
- Filtros de ano, competência, nome e CNPJ, com busca sem acentos.
- Ranking de vitórias confirmadas por processo e empresa, valores adjudicados, contratados e pagos separados.
- Remuneração bruta, descontos e líquido, mantendo valores ausentes como não informados.
- Histórico anual e acumulado, paginação e exportação CSV.
- Fonte por registro, cobertura mensal/anual e pendências de identificação.
- Coleta de todas as páginas públicas de resultados e participantes, persistência R2 e atualização agendada no Sites.

## Executar e testar

Node.js 22.13+ e pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

O painel está em `/painel`. A raiz redireciona para ele. É necessário configurar R2 para carregar os snapshots. O manifesto da cópia pública não inclui a identidade da instalação original; associe seu próprio projeto Sites antes de publicar. A automação da instalação original é gerenciada no Sites e não é criada ao clonar o repositório.

## Dados e cálculos

Fonte principal: [dados abertos Fiorilli da Prefeitura](https://sistemas.serafinacorrea.rs.gov.br/transparencia/versaoJson/DadosAbertos/) e [resultados detalhados](https://sistemas.serafinacorrea.rs.gov.br/transparencia/InformacoesLicitacoes.aspx).

Escopo: Empresa=1, Poder Executivo. A Câmara não está incluída. Favorecidos são agrupados por CNPJ completo. Pagamentos incluem fornecedores, repasses e obrigações; não são atribuídos automaticamente a uma licitação ou contrato.

Vitórias contam processos competitivos homologados com itens aceitos. Um processo conta uma vez por CNPJ, independentemente da quantidade de itens. Contratações diretas ficam separadas. A data do ranking é a da adjudicação. A identificação usa correspondência exata e única com os participantes; filiais com nome idêntico e CNPJs distintos não são atribuídas automaticamente. Valores de itens compartilhados sem rateio não são duplicados entre empresas.

Contratos usam a assinatura e excluem anulações. Folha usa competência, matrícula, vínculo e referência de folha. Valores nulos não são zero. Acumulados são nominais e limitados aos períodos disponíveis. As consultas de 2014–2016 retornaram HTTP 500; há histórico carregado de 2017 em diante, com cobertura exposta no painel.

## Atualização e acesso

Leia [as instruções do coletor](public/update-guide.md). O coletor valida TLS normalmente, complementando a cadeia municipal com um intermediário cuja assinatura é verificada contra uma raiz confiável. Credenciais entram somente por stdin. Não persistimos CPF nem dados bancários.

O painel permite leitura pública. O endpoint `/api/snapshot` exige o segredo de servidor `COLLECTOR_WRITE_TOKEN` no cabeçalho `X-Collector-Key`. Consulte o guia de atualização para configurar a coleta autenticada.

Testes cobrem contagem de processos, valores conjuntos sem rateio, salários ausentes, estornos, precisão monetária, busca, CSV e leitura dos layouts de resultados. Não há credenciais ou bases coletadas neste repositório.

## Perfis e comparação

Clique no nome de uma empresa ou servidor para abrir uma página individual. Os links usam `/painel?perfil=empresa&id=CNPJ` ou `/painel?perfil=servidor&id=MATRICULA`. A página carrega o histórico disponível desde 2017, permite filtrar os registros e copiar o endereço permanente. A exportação em um perfil contém somente os registros daquela identidade.

O botão Comparar períodos compara um mês com o anterior, incluindo dezembro na virada de ano. Com Todos os meses, compara a janela janeiro–mês corrente com a mesma janela do ano anterior; anos passados usam doze meses. Pagamentos e remuneração líquida são calculados separadamente, em valores nominais. Percentuais são omitidos quando faltam conjuntos ou valores; base anterior zero permite somente diferença absoluta. Um mês em andamento pode ter menos lançamentos que o anterior.

## Contratos, novidades e concentração

Vigências e vencimento atualizado vêm da API municipal. ADITADO é o valor agregado, não a lista dos termos aditivos. Consulte os documentos no portal. O filtro dos contratos usa a assinatura; escolha Todos os anos para contratos antigos.

Novidades mostram publicações e adjudicações dos últimos 30 dias e contratos com prazo em até 30 dias nos dados carregados. A marca de leitura fica neste navegador. Não há envio de email ou notificações externas.

A busca por objeto vincula processos, contratos e resultados por processo; não atribui pagamentos mensais a objetos sem vínculo na fonte. Concentração agrupa por CNPJ e divide os pagamentos dos maiores 1, 5 e 10 pelo total líquido dos filtros. Bases não positivas e saldos negativos bloqueiam o índice. Inclui repasses e obrigações; não indica irregularidade.

## Filtros da remuneração

Cargo, secretaria/divisão e forma de ingresso filtram cada registro da competência selecionada. Mudanças de cargo ou lotação podem dividir o acumulado de uma matrícula. Formas desconhecidas não são classificadas como não concursadas. Colunas Nome, Bruto, Descontos e Líquido aceitam ordenação crescente e decrescente; valores ausentes ficam ao final nas duas direções. Há controles equivalentes para telas pequenas. A exportação e os indicadores usam os mesmos filtros; o ranking de destaque mantém sua métrica identificada de líquido.

