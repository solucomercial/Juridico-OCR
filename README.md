# Jurídico OCR

Um sistema moderno de busca e visualização de documentos jurídicos processados por OCR (Reconhecimento Óptico de Caracteres). Permite pesquisar rapidamente em uma base de dados de documentos legais, facilitando o acesso a informações relevantes.

## 🚀 Funcionalidades

- **Busca Avançada**: Interface intuitiva para pesquisa de texto em documentos jurídicos
- **Resultados Rápidos**: Utiliza MeiliSearch para buscas eficientes e instantâneas
- **Visualização de Documentos**: Links diretos para visualizar arquivos processados
- **Interface Responsiva**: Design moderno e adaptável para desktop e mobile
- **Suporte a OCR**: Integração com documentos digitalizados e processados
- **Deploy Dockerizado**: Pronto para produção com Nginx Proxy Manager e SSL

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 16 com App Router (Standalone Mode)
- **Linguagem**: TypeScript
- **UI/UX**: Tailwind CSS + shadcn/ui components
- **Ícones**: Lucide React
- **Busca**: MeiliSearch
- **Containerização**: Docker & Docker Compose
- **Proxy Reverso**: Nginx Proxy Manager
- **SSL**: Let's Encrypt (via Nginx Proxy Manager)

## 📋 Pré-requisitos

### Desenvolvimento Local
- Node.js 18 ou superior
- npm, yarn, pnpm ou bun

### Produção (VM)
- Ubuntu 20.04+ ou similar
- Docker & Docker Compose
- Mínimo 2GB RAM
- Domínio configurado (opcional)

## 🚀 Instalação e Deploy

### Desenvolvimento Local

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd Juridico-OCR
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000)

### Deploy em Produção (Docker)

**📖 Para instruções completas, consulte [DEPLOY.md](DEPLOY.md)**

1. **Preparação rápida:**
   ```bash
   chmod +x setup-vm.sh
   ./setup-vm.sh
   newgrp docker
   ```

2. **Subir a aplicação:**
   ```bash
   docker-compose up -d --build
   ```

3. **Configurar Nginx Proxy Manager:**
   - Acesse: `http://IP-DA-VM:81`
   - Login: `admin@example.com` / `changeme`
   - Configure seu domínio e SSL

## 📂 Volumes Mapeados

A aplicação utiliza os seguintes volumes para acesso aos documentos:

```yaml
/mnt/ocr-juridico              → /juridico
/mnt/ocr-juridico-people       → /people
/mnt/ocr-juridico-Sign         → /sign
/mnt/ocr-juridico-sign_original_files → /sign_original_files
```

## ⚙️ Recursos do Container

### Nginx Proxy Manager
- CPU: 0.5 core (máx), 0.25 core (reserva)
- Memória: 512MB (máx), 256MB (reserva)

### Juridico-OCR App
- CPU: 1.0 core (máx), 0.5 core (reserva)
- Memória: 2GB (máx), 1GB (reserva)

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção (standalone)
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter ESLint

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── download/route.ts
│   │   │   └── search/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── search-interface.tsx
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── input.tsx
│   └── lib/
│       └── utils.ts
├── docker-compose.yml
├── dockerfile
├── setup-vm.sh
├── DEPLOY.md
└── README.md
```

## 🔧 Configuração

### MeiliSearch

O projeto utiliza MeiliSearch para indexação e busca:

1. Configure a instância do MeiliSearch
2. Crie um índice chamado "juridico"
3. Ajuste as credenciais em `search-interface.tsx`
4. Indexe os documentos processados por OCR

### Variáveis de Ambiente

Configure as seguintes variáveis no `search-interface.tsx`:
- `MEILI_URL`: URL do servidor MeiliSearch
- `SEARCH_KEY`: Chave de API para busca
- `FILE_SERVER`: URL do servidor de arquivos

## 🐳 Arquitetura Docker

O projeto utiliza uma arquitetura multi-container:

- **Nginx Proxy Manager**: Gerenciamento de SSL e proxy reverso
- **Juridico-OCR App**: Aplicação Next.js em modo standalone
- **Network Bridge**: Comunicação segura entre containers

### Otimizações

- Build multi-stage para imagens menores (~70% redução)
- Modo standalone do Next.js (apenas dependências necessárias)
- Usuário não-root para maior segurança
- Limites de recursos configurados

## 🔒 Segurança

- SSL/TLS via Let's Encrypt (Nginx Proxy Manager)
- Containers isolados em rede bridge
- Usuário não-privilegiado no container
- Limites de recursos para prevenir DoS

## 📊 Monitoramento

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f app

# Uso de recursos
docker stats
```

## 🛠️ Manutenção

### Atualizar a aplicação
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Backup dos dados
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz npm_data/ npm_letsencrypt/
```

### Limpar recursos não utilizados
```bash
docker system prune -a --volumes
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- Consulte a documentação completa em [DEPLOY.md](DEPLOY.md)
- Entre em contato com a equipe de desenvolvimento

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [MeiliSearch Documentation](https://www.meilisearch.com/docs)
- [Nginx Proxy Manager](https://nginxproxymanager.com/)
- [Docker Documentation](https://docs.docker.com/)
