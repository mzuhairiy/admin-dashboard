# syntax=docker/dockerfile:1
FROM node:22.23.4-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npx prisma generate

# One-shot migration/seed tooling, kept out of the application runtime image.
FROM dependencies AS db-tools
ENV NODE_ENV=production
COPY prisma ./prisma
USER node
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed -- --if-empty"]

FROM dependencies AS builder
COPY . .
RUN mkdir -p public && npm run build

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=dependencies --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=dependencies --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health', { signal: AbortSignal.timeout(4000) }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
