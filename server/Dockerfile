FROM golang:1.19-bullseye

RUN go install github.com/beego/bee/v2@latest

ENV APP_HOME /go/src/server
RUN mkdir -p "$APP_HOME"
WORKDIR "$APP_HOME"

COPY go.mod go.sum ./
RUN go mod vendor

COPY . .

EXPOSE 4000

CMD ["bee", "run"]