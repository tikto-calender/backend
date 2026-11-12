FROM node:25-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --chown=node:node package.json package-lock.json ./
RUN apk upgrade --no-cache \
    && npm ci --omit=dev \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY --chown=node:node src ./src
COPY --chown=node:node data ./data
COPY --chown=node:node server.mjs ./server.mjs

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.mjs"]
