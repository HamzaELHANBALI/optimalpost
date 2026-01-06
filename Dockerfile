# =========================
# Builder
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema BEFORE generate
COPY prisma ./prisma

# Generate Prisma Client (CRITICAL)
RUN npx prisma generate

# Copy rest of app
COPY . .

# Build Next.js
RUN npm run build

# =========================
# Runner
# =========================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy runtime artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
