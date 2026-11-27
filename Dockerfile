# Imagem de produção do front-end HealthIA (Cloud Run ou qualquer runtime de contêiner).
# A mesma imagem serve qualquer ambiente: o modo e a URL da API entram por variável
# de ambiente na inicialização (HEALTHIA_MODO, HEALTHIA_API_URL), não no build.

# --- Build: checagem de tipos e bundle do Vite ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Execução: nginx sem privilégios na porta 8080 ---
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

COPY --chown=101:101 --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/seguranca.inc.template /etc/nginx/templates/seguranca.inc.template
COPY --chmod=755 docker/15-healthia-config.envsh /docker-entrypoint.d/15-healthia-config.envsh

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz > /dev/null || exit 1
