package repositories

import (
	"log"
	"time"
	"context"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	config "github.com/alexandre-k/share-document-signatures/server/config"
)

type Repository struct {
	Client *mongo.Client
}

func ConnectDB(mongoURI string) (*mongo.Client) {
	log.Println("Connecting to database ", mongoURI)
	client, err := mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Ping MongoDB...")
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("... pong!")
	return client
}

func (r Repository) GetUsers() *mongo.Collection {
	return r.Client.Database(config.MongoDatabase()).Collection("users")
}


var Repo = &Repository{
	Client: ConnectDB(config.MongoDatabase()),
}
