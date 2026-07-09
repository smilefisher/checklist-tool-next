FROM node:22-alpine
WORKDIR /app
COPY . .
EXPOSE 4399
ENV HOSTNAME=0.0.0.0
ENV PORT=4399
CMD ["node", "server.js"]
