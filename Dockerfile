FROM node:20.12.0-bookworm-slim
RUN apt-get update && \
    apt-get install --yes --no-install-recommends \
    ca-certificates curl p7zip-full python3 python3-pip pipx && \
    rm -rf /var/lib/apt/lists/*

ENV PIPX_HOME /opt/pipx
ENV PIPX_BIN_DIR /usr/bin
RUN pipx install bs-highlighter

COPY --from=ghcr.io/whatwg/wattsi:latest /whatwg/wattsi/bin/wattsi /bin/wattsi

WORKDIR /app

COPY --from=ghcr.io/whatwg/html-build:latest /whatwg/html-build/build.sh /whatwg/html-build/lint.sh ./
COPY --from=ghcr.io/whatwg/html-build:latest /bin/html-build /bin/
COPY --from=ghcr.io/whatwg/html-build:latest /whatwg/html-build/entities ./entities/

COPY . .

RUN npm install --omit=dev

ENV PORT=3000

EXPOSE $PORT

ENTRYPOINT ["npm", "start"]
