FROM node:22-alpine AS base

WORKDIR /app

FROM base AS dev

COPY docker/entrypoints/frontend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .

EXPOSE 3100
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "dev"]

FROM base AS production

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .
RUN npm run build

EXPOSE 3100
CMD ["npm", "run", "start"]
