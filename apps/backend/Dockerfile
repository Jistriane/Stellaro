FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install && npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
