# VPS Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hospedar o site em `https://site.laboratoriosobral.com.br` na VPS Debian 12 usando Docker + Nginx + SSL Let's Encrypt.

**Architecture:** Nginx no host faz reverse proxy de :443 para o container Express em 127.0.0.1:3001. Certbot gerencia o certificado SSL. Deploy manual via SSH + git pull + docker compose up.

**Tech Stack:** Debian 12, Docker Engine, Docker Compose v2, Nginx, Certbot (Let's Encrypt)

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `docker-compose.yml` | modificar — porta 127.0.0.1:3001 |
| `/etc/nginx/sites-available/sobral` (VPS) | criar |
| `/home/projetos/site-sobral/server/.env` (VPS) | criar |

---

### Task 1: Ajustar porta no docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

O bind atual `"3001:3001"` expõe a porta em todas as interfaces. Na VPS compartilhada, o padrão é bind apenas em localhost.

- [ ] **Step 1: Atualizar `docker-compose.yml`**

Localizar o bloco `app:` e alterar:

```yaml
# de:
    ports:
      - "3001:3001"

# para:
    ports:
      - "127.0.0.1:3001:3001"
```

O arquivo completo do serviço `app` fica:

```yaml
  app:
    build: .
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - uploads:/app/public/images/produtos
    env_file:
      - ./server/.env
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER:-sobral}:${POSTGRES_PASSWORD:-sobral_pass}@db:5432/${POSTGRES_DB:-sobral}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
```

- [ ] **Step 2: Commit e push**

```bash
git add docker-compose.yml
git commit -m "fix(docker): bind porta app apenas em 127.0.0.1 para VPS"
git push origin main
```

---

### Task 2: Setup inicial da VPS

**Files:**
- Create: `/home/projetos/site-sobral/` (VPS)
- Create: `/home/projetos/site-sobral/server/.env` (VPS)

Todos os comandos abaixo rodam via SSH: `ssh suporte@191.101.18.82`

- [ ] **Step 1: Criar pasta de projetos e clonar repositório**

```bash
mkdir -p /home/projetos
cd /home/projetos
git clone https://github.com/W3SK3RRX/site-sobral.git site-sobral
cd site-sobral
```

Esperado: pasta `/home/projetos/site-sobral` criada com o código.

- [ ] **Step 2: Gerar JWT_SECRET**

```bash
openssl rand -base64 48
```

Copie o resultado — será o `JWT_SECRET` no `.env`.

- [ ] **Step 3: Criar `server/.env` de produção (com hash temporário)**

```bash
cat > /home/projetos/site-sobral/server/.env << 'EOF'
DATABASE_URL=postgresql://sobral:sobral_prod_pass@db:5432/sobral
JWT_SECRET=COLE_O_JWT_SECRET_GERADO_AQUI
ADMIN_EMAIL=admin@laboratoriosobral.com.br
ADMIN_PASSWORD=SUASENHA
ADMIN_PASSWORD_HASH=placeholder
POSTGRES_USER=sobral
POSTGRES_PASSWORD=sobral_prod_pass
POSTGRES_DB=sobral
SMTP_HOST=mail.laboratoriosobral.com.br
SMTP_PORT=465
SMTP_USER=contato@laboratoriosobral.com.br
SMTP_PASS=SENHA_SMTP_AQUI
CONTACT_TO=marketing@laboratoriosobral.com.br
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://site.laboratoriosobral.com.br
EOF
```

Substitua `COLE_O_JWT_SECRET_GERADO_AQUI`, `SUASENHA` e `SENHA_SMTP_AQUI` pelos valores reais. O `ADMIN_PASSWORD_HASH` será gerado no Task 3 após os containers subirem.

---

### Task 3: Subir containers Docker

Todos os comandos rodam via SSH em `/home/projetos/site-sobral`.

- [ ] **Step 1: Build e subir containers**

```bash
cd /home/projetos/site-sobral
docker compose up --build -d
```

Esperado: imagem buildada, containers `site-sobral-app-1` e `site-sobral-db-1` em status `Up`.

- [ ] **Step 2: Verificar containers rodando**

```bash
docker compose ps
```

Esperado:
```
NAME                STATUS
site-sobral-app-1   Up
site-sobral-db-1    Up (healthy)
```

- [ ] **Step 3: Rodar migrations**

```bash
docker compose exec app node server/src/db/migrate.js
```

Esperado: saída com as migrations aplicadas sem erros.

- [ ] **Step 4: Rodar seed**

```bash
docker compose exec app node server/src/db/seed.js
```

Esperado: seed executado sem erros (produtos e categorias criados).

- [ ] **Step 5: Gerar e atualizar ADMIN_PASSWORD_HASH no .env**

```bash
cd /home/projetos/site-sobral
HASH=$(docker compose exec app node -e "const b=require('bcryptjs');b.hash('SUASENHA',10).then(h=>process.stdout.write(h))")
sed -i "s|ADMIN_PASSWORD_HASH=placeholder|ADMIN_PASSWORD_HASH=$HASH|" server/.env
grep ADMIN_PASSWORD_HASH server/.env
```

Substitua `SUASENHA` pela mesma senha usada em `ADMIN_PASSWORD`. Esperado: linha com hash bcrypt `$2a$10$...`.

- [ ] **Step 6: Verificar app respondendo**

```bash
curl -s http://127.0.0.1:3001/api/products | head -c 200
```

Esperado: JSON com lista de produtos.

---

### Task 4: Configurar Nginx virtual host

Todos os comandos rodam via SSH como root ou com sudo.

- [ ] **Step 1: Criar config do site**

```bash
cat > /etc/nginx/sites-available/sobral << 'EOF'
server {
    listen 80;
    server_name site.laboratoriosobral.com.br;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
EOF
```

- [ ] **Step 2: Ativar o site**

```bash
ln -s /etc/nginx/sites-available/sobral /etc/nginx/sites-enabled/sobral
```

- [ ] **Step 3: Testar configuração Nginx**

```bash
nginx -t
```

Esperado: `syntax is ok` e `test is successful`.

- [ ] **Step 4: Reload Nginx**

```bash
systemctl reload nginx
```

- [ ] **Step 5: Verificar resposta HTTP**

```bash
curl -s -o /dev/null -w "%{http_code}" http://site.laboratoriosobral.com.br
```

Esperado: `200` (ou `301` se o DNS ainda não propagou — nesse caso aguardar).

---

### Task 5: SSL com Certbot

- [ ] **Step 1: Verificar propagação DNS**

Antes de pedir o certificado, confirmar que o domínio aponta para a VPS:

```bash
dig +short site.laboratoriosobral.com.br
```

Esperado: `191.101.18.82`. Se retornar outro IP ou vazio, aguardar propagação DNS (pode levar até 24h).

- [ ] **Step 2: Emitir certificado SSL**

```bash
certbot --nginx -d site.laboratoriosobral.com.br
```

Certbot perguntará um e-mail para notificações de renovação. Aceite os termos. Escolha redirecionar HTTP→HTTPS quando perguntado.

Esperado: `Successfully deployed certificate` e Nginx recarregado automaticamente.

- [ ] **Step 3: Verificar HTTPS**

```bash
curl -s -o /dev/null -w "%{http_code}" https://site.laboratoriosobral.com.br/api/products
```

Esperado: `200`.

- [ ] **Step 4: Verificar renovação automática**

```bash
certbot renew --dry-run
```

Esperado: `Congratulations, all simulated renewals succeeded`.

---

### Task 6: Verificação final

- [ ] **Step 1: Abrir o site no navegador**

Acessar `https://site.laboratoriosobral.com.br` — deve exibir o site com cadeado verde.

- [ ] **Step 2: Testar login admin**

Acessar `https://site.laboratoriosobral.com.br/admin` e logar com as credenciais do `.env`.

- [ ] **Step 3: Verificar logs (opcional)**

```bash
cd /home/projetos/site-sobral
docker compose logs --tail=50 app
```

Sem erros críticos esperado.

- [ ] **Step 4: Testar workflow de atualização**

Fazer uma pequena alteração no código local, push, e na VPS:

```bash
cd /home/projetos/site-sobral
git pull origin main
docker compose up --build -d
```

Verificar que o site reflete a mudança.
