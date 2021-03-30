FROM node:15.12.0-buster-slim
RUN apt-get update && \
    apt-get install --yes --no-install-recommends p7zip-full && \
    rm -rf /var/lib/apt/lists/*

COPY --from=whatwg/wattsi:129 /whatwg/wattsi/bin/wattsi /bin/wattsi

WORKDIR /app

COPY . .

RUN npm install --production

ENV PORT=3000

EXPOSE $PORT

ENTRYPOINT ["npm", "start"]