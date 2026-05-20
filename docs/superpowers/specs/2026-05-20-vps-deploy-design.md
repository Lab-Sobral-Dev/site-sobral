# VPS Deploy — Design Spec

**Goal:** Hospedar o site em produção na VPS Debian 12 em `site.laboratoriosobral.com.br` usando Docker + Nginx com SSL Let's Encrypt.

**Arquitetura:** Nginx no host reverse-proxy → Docker app na porta 127.0.0.1:3001. Certbot gerencia SSL. Deploy manual via SSH + git pull + docker compose up.

**Ambiente:** VPS Debian 12, IP 191.101.18.82, Docker e Nginx já instalados.

---

## Arquitetura

```
Internet
    ↓ :80 → redirect HTTPS
    ↓ :443 (SSL, Let's Encrypt)
  Nginx (host) — /etc/nginx/sites-available/sobral
    ↓ proxy_pass http://127.0.0.1:3001
  Docker: app (Express, 127.0.0.1:3001→3001)
    ├── serve /api/* → rotas Express
    └── serve /* → dist/index.html (SPA)
         ↓
  Docker: db (Postgres, porta interna apenas)
```

---

## Localização dos arquivos

| Item | Caminho na VPS |
|------|----------------|
| Projeto | `/home/projetos/site-sobral` |
| Nginx config | `/etc/nginx/sites-available/sobral` |
| Nginx symlink | `/etc/nginx/sites-enabled/sobral` |
| server/.env | `/home/projetos/site-sobral/server/.env` |
| Uploads volume | Docker named volume `site-sobral_uploads` |

---

## Alteração no docker-compose.yml

O bind atual `"3001:3001"` expõe a porta em todas as interfaces. Na VPS, deve ser restrito ao localhost (padrão dos outros projetos):

```yaml
# de:
ports:
  - "3001:3001"

# para:
ports:
  - "127.0.0.1:3001:3001"
```

Esta alteração vai para o repositório (é segura — não contém segredos).

---

## Nginx virtual host

Arquivo `/etc/nginx/sites-available/sobral`:

```nginx
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
```

Após ativar, Certbot adiciona o bloco HTTPS automaticamente:
```bash
certbot --nginx -d site.laboratoriosobral.com.br
```

---

## server/.env de produção (VPS)

Criado manualmente na VPS — nunca commitado:

```env
DATABASE_URL=postgresql://sobral:sobral_pass@db:5432/sobral
JWT_SECRET=<string-aleatoria-longa>
ADMIN_EMAIL=admin@laboratoriosobral.com.br
ADMIN_PASSWORD=<senha-forte>
ADMIN_PASSWORD_HASH=<hash-bcrypt>
POSTGRES_USER=sobral
POSTGRES_PASSWORD=sobral_pass
POSTGRES_DB=sobral
SMTP_HOST=mail.laboratoriosobral.com.br
SMTP_PORT=465
SMTP_USER=contato@laboratoriosobral.com.br
SMTP_PASS=<senha-smtp>
CONTACT_TO=marketing@laboratoriosobral.com.br
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://site.laboratoriosobral.com.br
```

---

## Passos do deploy inicial

1. Ajustar `docker-compose.yml` (porta 127.0.0.1) → commit + push
2. SSH na VPS como `suporte`
3. Criar pasta: `mkdir -p /home/projetos`
4. Clonar repo: `git clone https://github.com/W3SK3RRX/site-sobral.git /home/projetos/site-sobral`
5. Criar `server/.env` com as vars de produção
6. Subir containers: `docker compose up --build -d`
7. Rodar migrations: `docker compose exec app node server/src/db/migrate.js`
8. Rodar seed: `docker compose exec app node server/src/db/seed.js`
9. Criar config Nginx + symlink + reload
10. Emitir certificado SSL com Certbot
11. Verificar `https://site.laboratoriosobral.com.br`

---

## Workflow de atualização

```bash
ssh suporte@191.101.18.82
cd /home/projetos/site-sobral
git pull origin main
docker compose up --build -d
# se houver nova migration:
docker compose exec app node server/src/db/migrate.js
```

---

## Portas — sem conflito

| Porta host | Serviço | Status |
|-----------|---------|--------|
| 80 | Nginx (compartilhado) | já em uso — adicionamos virtual host |
| 443 | Nginx SSL (compartilhado) | já em uso — Certbot adiciona bloco |
| 127.0.0.1:3001 | site-sobral app | **livre** ✅ |
| db Postgres | interno Docker | sem exposição no host |
