FROM node:22-slim AS build
RUN corepack enable pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM node:22-slim
# chromium: headless browser for PDF generation via Puppeteer
# fonts-liberation: fallback fonts so text renders instead of blank boxes (not a chromium dep)
# libdrm2: Direct Rendering Manager, required by libgbm1 (not a chromium dep)
# The remaining chromium deps (libnss3, libgbm1, libatk*, libcups2, libx*) are
# auto-installed as hard dependencies of the chromium package.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libdrm2 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN corepack enable pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist
RUN mkdir -p data

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
