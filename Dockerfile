# syntax=docker/dockerfile:1

# ---------- Stage 1: deps (ติดตั้ง dependencies ทั้งหมด) ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: builder (generate Prisma client + build Nest) ----------
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma7.config.ts อ่าน DATABASE_URL ตอน generate (ใช้ค่า dummy ได้ ไม่ได้เชื่อมต่อจริง)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate --config prisma7.config.ts \
    && npm run build

# ใช้ stage นี้สำหรับรัน migration (มี prisma CLI + migrations ครบ)
# docker build --target builder -t legal-contract-migrate .

# ---------- Stage 3: runner (production image เล็ก ๆ) ----------
FROM node:24-alpine AS runner
ENV NODE_ENV=production \
    PORT=3001 \
    UPLOAD_DIR=/app/uploads/contracts \
    UPLOAD_DIR_LEGAL_DOCS=/app/uploads/legal-documents \
    UPLOAD_DIR_LEGAL_CASES=/app/uploads/legal-cases \
    TICKET_UPLOAD_DIR=/app/uploads/tickets
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma client ที่ generate แล้ว + โค้ดที่ build แล้ว
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

# โฟลเดอร์เก็บไฟล์อัปโหลด (mount เป็น volume ตอนรัน)
RUN mkdir -p /app/uploads/contracts /app/uploads/legal-documents /app/uploads/legal-cases /app/uploads/tickets && chown -R node:node /app
USER node

EXPOSE 3001
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/docs >/dev/null 2>&1 || exit 1

CMD ["node", "dist/main"]
