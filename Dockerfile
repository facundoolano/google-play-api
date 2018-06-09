FROM node:alpine

MAINTAINER Srikanth Lakshmanan <srik@srik.me>

COPY . ./

RUN npm install

ENV NODE_ENV production

EXPOSE 3000

CMD ["npm", "start"]
