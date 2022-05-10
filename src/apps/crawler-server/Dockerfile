# WARNING: this needs to be run from the root of the monorepo
FROM node:17 as build-crawler-server
WORKDIR /opt/monorepo
COPY . .
RUN npm ci && npx turbo run build --filter=crawler-server

FROM node:17 as server
WORKDIR /home/node/crawler-server
COPY --from=build-crawler-server /opt/monorepo/src/apps/crawler-server/build ./build
ENV NODE_ENV production
RUN npm install pm2 -g
# no need to run npm ci, because parcel is configured to include dependencies
CMD [ "npx", "pm2-runtime", "build/index.js" ]
