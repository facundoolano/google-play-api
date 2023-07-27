FROM node:alpine

LABEL maintainer="Srikanth <srikanth@cashlessconsumer.in>"

LABEL version="1.0"

LABEL description="Docker image for running Google Play API"

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "npm", "start" ]
