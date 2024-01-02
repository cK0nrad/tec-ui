FROM node:20-alpine

ARG API
ARG GTFS_API

ENV NEXT_PUBLIC_API=$API
ENV NEXT_PUBLIC_GTFS_API=$GTFS_API

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn install

COPY . ./

RUN yarn build
EXPOSE 3000

# Start application
CMD [ "npx", "--yes", "serve@latest", "out" ]