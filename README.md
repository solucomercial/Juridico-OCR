# Jurídico OCR

Um sistema moderno de busca e visualização de documentos jurídicos processados por OCR (Reconhecimento Óptico de Caracteres). Permite pesquisar rapidamente em uma base de dados de documentos legais, facilitando o acesso a informações relevantes.

## Funcionalidades

- **Busca Avançada**: Interface intuitiva para pesquisa de texto em documentos jurídicos
- **Resultados Rápidos**: Utiliza MeiliSearch para buscas eficientes e instantâneas
- **Visualização de Documentos**: Links diretos para visualizar arquivos processados
- **Interface Responsiva**: Design moderno e adaptável para desktop e mobile
- **Suporte a OCR**: Integração com documentos digitalizados e processados

## Tecnologias Utilizadas

- **Framework**: Next.js 16 com App Router
- **Linguagem**: TypeScript
- **UI/UX**: Tailwind CSS + shadcn/ui components
- **Ícones**: Lucide React
- **Busca**: MeiliSearch
- **Servidor de Arquivos**: Servidor local para arquivos processados

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm, yarn, pnpm ou bun
- Servidor MeiliSearch configurado
- Servidor de arquivos local (porta 8000)

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd juridico-ocr
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   # ou
   bun install
   ```

3. Configure as variáveis de ambiente (se necessário):
   - O MeiliSearch URL e chave estão hardcoded no componente `search-interface.tsx`
   - Ajuste `MEILI_URL`, `SEARCH_KEY` e `FILE_SERVER` conforme seu ambiente

## Uso

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   # ou
   bun dev
   ```

2. Abra [http://localhost:3000](http://localhost:3000) no navegador

3. Digite termos de busca na interface e pressione Enter ou clique em "Buscar"

4. Visualize os resultados e clique nos links para acessar os documentos

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter ESLint

## Estrutura do Projeto

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
├── components/
│   ├── search-interface.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
└── lib/
    └── utils.ts
```

## Configuração do MeiliSearch

O projeto utiliza MeiliSearch para indexação e busca. Certifique-se de:

1. Ter uma instância do MeiliSearch rodando
2. Criar um índice chamado "juridico"
3. Configurar a chave de API para busca
4. Indexar os documentos processados por OCR

## Servidor de Arquivos

Os arquivos são servidos localmente na porta 8000. Configure um servidor web (como Nginx ou Apache) ou use um servidor de desenvolvimento para servir os arquivos PDF/processados.

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.
