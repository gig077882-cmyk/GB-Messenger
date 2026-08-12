FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY db ./db
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
RUN useradd --system --uid 10001 krug
COPY --from=build --chown=krug:krug /app/node_modules ./node_modules
COPY --from=build --chown=krug:krug /app/dist ./dist
COPY --from=build --chown=krug:krug /app/db ./db
COPY --from=build --chown=krug:krug /app/package.json ./package.json
RUN mkdir -p /app/data/storage && chown -R krug:krug /app/data
USER krug
EXPOSE 3000
CMD ["node", "dist/server.js"]
