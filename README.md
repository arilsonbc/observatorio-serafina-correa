# Observatório Serafina

Painel cidadão para acompanhar licitações, contratos, pagamentos a fornecedores e remunerações da Prefeitura de Serafina Corrêa/RS.

## Recursos

- Filtros por ano, mês e nome.
- Rankings de pagamentos e remuneração líquida.
- Histórico anual e acumulado dos períodos carregados.
- Catálogo de licitações e processos vinculados a contratos.
- Coleta da API oficial Fiorilli, armazenamento R2 e exportação CSV.

## Executar

Requisitos: Node.js 22.13 ou superior e pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Para compilar: `pnpm build`. O painel está em `/painel`; `/` redireciona para ele. Para a coleta persistente é necessário configurar o armazenamento R2. O manifesto não contém a identidade da instalação hospedada; associe-o ao seu próprio projeto Sites antes de publicar.

## Fontes e cobertura

API oficial: https://sistemas.serafinacorrea.rs.gov.br/transparencia/versaoJson/DadosAbertos/

A integração fixa Empresa=1 e limita fornecedores a CNPJs completos. A coleta inicial obteve registros disponíveis de 2017 a 2026; testes de 2014 a 2016 retornaram HTTP 500. Dados ausentes não equivalem a zero.

Pagamentos são totais mensais por fornecedor. Contratos são filtrados por assinatura e excluem anulações. A folha é agrupada por competência, matrícula, contrato e referência de folha. O acumulado é nominal e considera somente os períodos disponíveis.

A API municipal não identifica os vencedores: processos com contrato não equivalem a vitórias de licitação.

## Coleta e acesso

Consulte [as instruções de atualização](public/update-guide.md). O coletor usa a validação HTTPS normal, complementando a cadeia com um intermediário assinado por uma raiz confiável. Credenciais entram somente por stdin. CPF e dados bancários não são transmitidos ao painel.

O endpoint `/api/snapshot` depende da autenticação e do acesso exclusivo do proprietário fornecidos pelo Sites. Mantenha a aplicação hospedada privada. Se implantar fora do Sites, implemente autenticação antes de expor esse endpoint. Tornar este repositório público não altera o acesso da aplicação.

Este repositório contém o código, sem credenciais, bases de remunerações coletadas, arquivos de build ou histórico interno de publicação. A automação agendada da instalação original é gerenciada no Sites e não é criada automaticamente ao clonar o código.
