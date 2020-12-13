ARG BASE_IMAGE=node:12.20.0-buster

FROM ${BASE_IMAGE}
COPY . /hypertrons
WORKDIR /hypertrons
RUN chown -R node:node /hypertrons
USER node
RUN npm install && npm audit fix && npm run tsc
RUN sed -i 's#--daemon##' package.json
EXPOSE 7001
CMD npm start
