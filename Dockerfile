# Obraz aplikacji Tebby na własny serwer (VPS).
#
# Trzy etapy, żeby finalny obraz nie wlókł za sobą node_modules z narzędziami
# deweloperskimi. Build korzysta z trybu `standalone` Next.js — włącza go
# zmienna BUILD_STANDALONE, dzięki czemu wdrożenie na Vercelu zachowuje się
# dokładnie tak jak dotąd (patrz next.config.ts).
#
# Budowanie i uruchomienie opisuje docs/wdrozenie-vps.md.

# --- 1. zależności -----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- 2. build ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Adres i klucz są wkompilowywane w kod przeglądarki (NEXT_PUBLIC_*), więc
# muszą być znane już na etapie budowania. To NIE są sekrety: anon key jest
# publiczny z definicji, a dostępu pilnuje RLS w bazie.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    BUILD_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1

# `prebuild` kopiuje Monaco do public/monaco — edytor jest self-hostowany,
# bo CSP blokuje CDN, a pracownia bywa bez internetu.
RUN npm run build

# --- 3. obraz uruchomieniowy -------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# public/ zawiera Monaco (ok. 24 MB) i grafikę marki — tryb standalone go nie
# pakuje, trzeba skopiować osobno, tak samo jak .next/static.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Prosty healthcheck: serwer ma odpowiadać cokolwiek na stronie logowania
# (ta jedna nie potrzebuje danych z bazy).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/admin/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
