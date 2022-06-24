# WARNING: this needs to be run from the root of the monorepo
FROM node:17
WORKDIR /opt/monorepo
COPY . .
RUN npm ci && npx turbo run build --filter=crawler-server
RUN npm install pm2 -g
WORKDIR /opt/monorepo/src/apps/crawler-server
# no need to run npm ci, because parcel is configured to include dependencies
CMD [ "npx", "pm2-runtime", "build/index.js" ]
