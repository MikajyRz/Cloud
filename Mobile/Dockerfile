FROM node:latest
WORKDIR /app
RUN npm i -g serve
COPY dist ./dist
EXPOSE 80
CMD ["serve","-s","dist","-l","80"]
