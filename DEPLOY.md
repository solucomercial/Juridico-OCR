# 🚀 Guia de Deploy - Juridico OCR

## 📋 Pré-requisitos

- Ubuntu 20.04+ ou VM com Linux
- Pelo menos 2GB de RAM disponível
- Domínio configurado (solucoesterceirizadas.cloud)

## 🛠️ Preparação da VM

### 1. Transferir arquivos para a VM

```bash
# Usando SCP (do seu computador local)
scp -r ./Juridico-OCR usuario@IP-DA-VM:/home/usuario/
```

### 2. Executar script de setup

```bash
cd /home/usuario/Juridico-OCR
chmod +x setup-vm.sh
./setup-vm.sh
```

### 3. Aplicar permissões do Docker

```bash
# Opção 1: Logout e login novamente
exit

# Opção 2: Ativar grupo sem logout
newgrp docker
```

## 🐳 Subindo a Aplicação

### Build e inicialização

```bash
docker-compose up -d --build
```

### Verificar status

```bash
docker-compose ps
docker-compose logs -f app
```

## 🌐 Configuração do Nginx Proxy Manager

### 1. Acessar o painel

Abra no navegador: `http://IP-DA-VM:81`

**Credenciais iniciais:**
- Email: `admin@example.com`
- Senha: `changeme`

⚠️ **Troque a senha imediatamente após o primeiro login!**

### 2. Adicionar Proxy Host

1. Clique em **"Proxy Hosts"** → **"Add Proxy Host"**
2. Preencha:
   - **Domain Names:** `solucoesterceirizadas.cloud` e `www.solucoesterceirizadas.cloud`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `juridico-ocr-app` (nome do container)
   - **Forward Port:** `3000`
   - ✅ Marque: **Block Common Exploits**
   - ✅ Marque: **Websockets Support**

3. Na aba **"SSL"**:
   - ✅ Marque: **Force SSL**
   - ✅ Marque: **HTTP/2 Support**
   - ✅ Marque: **HSTS Enabled**
   - Selecione: **Request a new SSL Certificate**
   - ✅ Marque: **Use a DNS Challenge**
   - Insira seu email

4. Clique em **Save**

## 🔍 Verificações de Saúde

### Verificar containers

```bash
docker ps
```

Você deve ver:
- `nginx-proxy-manager` (portas 80, 443, 81)
- `juridico-ocr-app` (porta 3000 interna)

### Logs em tempo real

```bash
# App
docker-compose logs -f app

# Nginx
docker-compose logs -f nginx-proxy
```

### Testar a aplicação

```bash
# Teste local (dentro da VM)
curl http://localhost:3000

# Teste através do domínio (após configurar DNS)
curl https://solucoesterceirizadas.cloud
```

## 🔧 Manutenção

### Atualizar a aplicação

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Ver uso de recursos

```bash
docker stats
```

### Limpar recursos não utilizados

```bash
docker system prune -a --volumes
```

### Backup dos dados do Nginx

```bash
tar -czf nginx-backup-$(date +%Y%m%d).tar.gz npm_data/ npm_letsencrypt/
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Reconstruir do zero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Problema com SSL

```bash
# Reiniciar o Nginx Proxy Manager
docker-compose restart nginx-proxy

# Verificar logs
docker-compose logs nginx-proxy
```

### Porta 80/443 já em uso

```bash
# Verificar o que está usando a porta
sudo lsof -i :80
sudo lsof -i :443

# Parar serviço conflitante (ex: Apache)
sudo systemctl stop apache2
```

## 📊 Monitoramento

### CPU e Memória

```bash
docker stats juridico-ocr-app
```

### Espaço em disco

```bash
df -h
docker system df
```

## 🔐 Segurança

### Firewall (UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 81/tcp  # Acesso ao painel (apenas temporário)
sudo ufw enable
```

⚠️ **Após configurar o Nginx, bloqueie a porta 81:**

```bash
sudo ufw deny 81/tcp
```

### Atualizações de segurança

```bash
sudo apt update && sudo apt upgrade -y
```

## 📞 Suporte

Para problemas, verificar:
1. Logs do Docker: `docker-compose logs`
2. Status dos containers: `docker-compose ps`
3. Espaço em disco: `df -h`
4. Memória disponível: `free -h`
