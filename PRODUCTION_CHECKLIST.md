# Checklist de produção

## Obrigatório antes de vender

- Trocar o e-mail e a senha inicial do administrador e ativar 2FA.
- Configurar domínio, HTTPS, `COOKIE_SECURE=true` e `ALLOWED_ORIGINS`.
- Configurar e homologar Mercado Pago e a assinatura do webhook.
- Substituir o cálculo demonstrativo de frete por uma transportadora ou serviço real.
- Configurar o número real do WhatsApp, endereço e horários de retirada no CMS.
- Publicar política de privacidade, termos de compra, trocas, devoluções e prazos.
- Configurar e-mails transacionais para pedido, pagamento, envio e cancelamento.

## Infraestrutura e segurança

- Usar Node 22 LTS e atualizar Vite antes da implantação.
- Servir o frontend por CDN ou proxy com CSP e demais cabeçalhos HTTP.
- Guardar uploads em S3, Cloudinary ou equivalente, não no disco efêmero da aplicação.
- Armazenar segredos em cofre de credenciais e criptografar o segredo TOTP em repouso.
- Aplicar rate limiting também no proxy, especialmente em login, pedidos e webhooks.
- Criar backups automáticos do PostgreSQL e testar restauração.
- Configurar logs centralizados, monitoramento de erros, disponibilidade e alertas.

## Operação

- Definir expiração automática de pedidos não pagos e liberação de estoque.
- Validar estoque, embalagem, prazo de produção e fluxo de retirada com a equipe.
- Fazer testes completos em celular e computador, incluindo pagamento aprovado, recusado e estornado.
- Criar ambiente de homologação separado da produção.
