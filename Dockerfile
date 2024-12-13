# 先编译
FROM node:lts-alpine AS build

WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build


# 准备运行
FROM node:lts-alpine

WORKDIR /app
COPY --from=build /app/out /app

RUN npm install -g serve

EXPOSE 3000

CMD ["npx", "serve", "."]