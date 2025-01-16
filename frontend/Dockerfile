FROM node:14-alpine AS build-deps

ENV TZ=America/Bogota
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && dpkg-reconfigure -f noninteractive tzdata

ENV NODE_OPTIONS=--max_old_space_size=3072
ENV GENERATE_SOURCEMAP=false
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --force
COPY .env* ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

FROM nginx:alpine

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

COPY .docker/nginx /etc/nginx/
    
ENV PUBLIC_HTML=/var/www/public/
COPY --from=build-deps /usr/src/app/build ${PUBLIC_HTML}

COPY .docker/add-env-vars.sh /docker-entrypoint.d/01-add-env-vars.sh

EXPOSE 80

RUN chmod +x /docker-entrypoint.d/01-add-env-vars.sh