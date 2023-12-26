FROM node:20-alpine

ARG API
ARG GTFS_API

ENV NEXT_PUBLIC_API=$API
ENV NEXT_PUBLIC_GTFS_API=$GTFS_API

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy app source code
ADD src ./

RUN yarn build

#Expose port and start application
EXPOSE 3000

# Start application
CMD [ "yarn", "start" ]