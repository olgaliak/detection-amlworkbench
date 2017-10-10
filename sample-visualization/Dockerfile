FROM node:latest

RUN apt-get update
RUN npm install -g n yarn
RUN n latest

ADD . .
RUN yarn
RUN yarn build
RUN yarn global add serve

CMD serve -s build -p 80
