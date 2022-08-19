# Install dependencies only when needed
FROM node:17-alpine
WORKDIR /usr/src/app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* hellosign-sdk-6.0.0.tgz ./

RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]
