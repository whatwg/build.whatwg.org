FROM node:16.15.0-buster-slim
RUN apt-get update && \
    apt-get install --yes --no-install-recommends p7zip-full && \
    rm -rf /var/lib/apt/lists/*

COPY --from=whatwg/wattsi:latest /whatwg/wattsi/bin/wattsi /bin/wattsi

WORKDIR /app

COPY . .

RUN npm install --production

ENV PORT=3000

EXPOSE $PORT

ENTRYPOINT ["npm", "start"]
