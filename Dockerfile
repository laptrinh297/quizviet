# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Placeholder URL để prisma generate và next build dùng đúng PostgreSQL adapter.
# URL thật sẽ được inject lúc runtime từ docker-compose / Dokploy.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

# Generate Prisma Client cho PostgreSQL (prisma.config.ts sẽ chọn schema.prod.prisma)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ── Stage 3: Production runtime ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma files để chạy db push khi container start
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER nextjs

EXPOSE 3000

# Migrate schema rồi mới start app
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
