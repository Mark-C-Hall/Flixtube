FROM node:16.16.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY ./src ./src

COPY ./videos ./videos

CMD ["npm", "start"]