# Casa Mamulengo

Loja virtual de artesanato em madeira com frontend React + Vite e API FastAPI.

## Banco PostgreSQL

O backend usa PostgreSQL 16, SQLAlchemy 2 e migrações Alembic. Para iniciar o banco com Docker:

```bash
docker compose up -d postgres
```

Ou use uma instalação local na porta `5433`, criando o banco e usuário:

```sql
CREATE ROLE casa_mamulengo WITH LOGIN PASSWORD 'casa_mamulengo';
CREATE DATABASE casa_mamulengo OWNER casa_mamulengo;
```

Copie `backend/.env.example` para `backend/.env` e altere senhas antes de publicar.

## Rodar o projeto

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8010
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. A documentação da API fica em `http://localhost:8010/docs`.

## Pagamentos

O checkout está preparado para Mercado Pago Checkout Pro. Sem credenciais, pedidos
locais ficam reservados e marcados como aguardando configuração, sem fingir uma
aprovação. Configure no `backend/.env`:

```bash
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
MERCADO_PAGO_WEBHOOK_SECRET="..."
FRONTEND_PUBLIC_URL="https://sua-loja.com.br"
API_PUBLIC_URL="https://api.sua-loja.com.br"
COOKIE_SECURE=true
ALLOWED_ORIGINS="https://sua-loja.com.br"
APP_ENV=production
REQUIRE_ADMIN_2FA=true
```

No painel do Mercado Pago, cadastre o webhook de pagamentos em
`https://api.sua-loja.com.br/api/payments/mercado-pago/webhook`.

## E-mails transacionais

O backend envia confirmação de pedido e aviso de mudança de status quando SMTP
estiver configurado. Sem SMTP, a loja continua criando pedidos normalmente.

```bash
SMTP_HOST="smtp.seuprovedor.com"
SMTP_PORT=587
SMTP_USER="usuario"
SMTP_PASSWORD="senha"
SMTP_FROM="Loja <pedidos@sua-loja.com.br>"
SMTP_TLS=true
SHOP_NOTIFICATION_EMAIL="atendimento@sua-loja.com.br"
```

## Painel administrativo

Acesse `http://localhost:5173/admin`.

Defina as credenciais administrativas no ambiente antes do primeiro uso:

```bash
export ADMIN_EMAIL="seu-email@dominio.com"
export ADMIN_PASSWORD="uma-senha-forte-com-12-ou-mais-caracteres"
```

Em produção, mantenha `REQUIRE_ADMIN_2FA=true`. O primeiro login permite
configurar o aplicativo autenticador; depois disso, o painel bloqueia edições
até o 2FA estar ativo.

Produtos, categorias, usuários, sessões, pedidos e itens ficam no PostgreSQL. As imagens enviadas pelo painel ficam em `backend/uploads/`; para produção, recomenda-se S3, Cloudinary ou serviço equivalente.

No painel, em **Conteúdo > Informações de contato**, configure:

- o número do WhatsApp com código do país e DDD, somente números;
- a mensagem inicial do atendimento;
- o endereço e as instruções para retirada local;
- cidade, UF e CEP usados internamente nos pedidos retirados na loja.

Consulte também [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) antes de abrir a loja ao público.
