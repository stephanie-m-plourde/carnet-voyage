FROM node:20-alpine

# Dépendances système pour sharp (traitement d'images)
RUN apk add --no-cache vips-dev python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/uploads && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

CMD ["node", "server.js"]
