# Observatório Serafina

Painel cidadão de licitações, resultados homologados, contratos, pagamentos e remuneração da Prefeitura de Serafina Corrêa/RS.

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

O endpoint `/api/snapshot` depende da autenticação e do acesso exclusivo do proprietário fornecidos pelo Sites. Mantenha a aplicação hospedada privada. Se implantar fora do Sites, implemente autenticação antes de expor o endpoint. A publicidade do repositório não altera o acesso da aplicação.

Testes cobrem contagem de processos, valores conjuntos sem rateio, salários ausentes, estornos, precisão monetária, busca, CSV e leitura dos layouts de resultados. Não há credenciais ou bases coletadas neste repositório.
