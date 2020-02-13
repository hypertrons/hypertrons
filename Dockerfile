FROM node:10.16.0-jessie
WORKDIR /root/hypertrons
COPY . /root/hypertrons
RUN npm install && npm audit fix && npm run tsc
EXPOSE 7001
CMD npm start
