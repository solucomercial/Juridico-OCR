#!/bin/bash

# Script de preparação do ambiente na VM para o projeto Juridico-OCR

echo "🚀 Iniciando setup do Juridico-OCR..."

# 1. Atualizar o sistema
echo "📦 Atualizando sistema..."
sudo apt update

# 2. Instalar Docker e Docker Compose
echo "🐳 Instalando Docker e Docker Compose..."
sudo apt install -y docker.io docker-compose

# 3. Habilitar Docker no boot
echo "⚙️  Configurando Docker..."
sudo systemctl enable docker
sudo systemctl start docker

# 4. Adicionar usuário ao grupo docker
echo "👤 Adicionando usuário ao grupo docker..."
sudo usermod -aG docker $USER

# 5. Criar diretórios necessários
echo "📁 Criando diretórios para volumes..."
mkdir -p npm_data npm_letsencrypt

# 6. Definir permissões
echo "🔐 Configurando permissões..."
chmod 755 npm_data npm_letsencrypt

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: docker-compose up -d --build"
echo "   2. Aguarde o build finalizar (~5-10 minutos)"
echo "   3. Acesse http://IP-DA-VM:81 para configurar o Nginx Proxy Manager"
echo "      Credenciais padrão:"
echo "      Email: admin@example.com"
echo "      Senha: changeme"
echo "   4. Configure seu domínio solucoesterceirizadas.cloud no painel"
echo ""
echo "⚠️  IMPORTANTE: Faça logout e login novamente para aplicar as permissões do Docker"
echo "   Ou execute: newgrp docker"
echo ""
