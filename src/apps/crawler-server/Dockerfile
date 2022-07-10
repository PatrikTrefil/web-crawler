# WARNING: this needs to be run from the root of the monorepo
FROM node:17
WORKDIR /opt/monorepo
COPY . .
WORKDIR /opt/monorepo/src/apps/crawler-server
RUN npm ci
WORKDIR /opt/monorepo
RUN npx turbo run build --filter=crawler-server
RUN npm install pm2 -g
WORKDIR /opt/monorepo/src/apps/crawler-server
CMD [ "npx", "pm2-runtime", "build/index.js" ]
