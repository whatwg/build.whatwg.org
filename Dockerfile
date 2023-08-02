FROM node:18.17.0-bookworm-slim
RUN apt-get update && \
    apt-get install --yes --no-install-recommends p7zip-full && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/whatwg/wattsi:latest /whatwg/wattsi/bin/wattsi /bin/wattsi

WORKDIR /app

COPY . .

RUN npm install --production

ENV PORT=3000

EXPOSE $PORT

ENTRYPOINT ["npm", "start"]
