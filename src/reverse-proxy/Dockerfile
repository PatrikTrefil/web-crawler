# WARNING: this needs to be run from the root of the monorepo
FROM node:17 as build-crawler-web
WORKDIR /opt/monorepo
COPY . .
RUN npm ci && npx turbo run build --filter=crawler-web

FROM nginx as server
COPY ./src/reverse-proxy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-crawler-web /opt/monorepo/src/apps/crawler-web/build /usr/share/nginx/html/
