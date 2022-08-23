package repositories

import (
	"context"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"
	"time"

	config "github.com/alexandre-k/share-document-signatures/server/config"
)

type Repository struct {
	Client *mongo.Client
}

func ConnectDB(mongoURI string) *mongo.Client {
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

func (r Repository) GetCollection(collName string) *mongo.Collection {
	return r.Client.Database(config.MongoDatabase()).Collection(collName)
}

// func (r Repository) All(collName string) []bson.M {
// 	var results []bson.M
// 	coll := r.GetCollection(collName)
// 	cursor, err := coll.Find(context.Background(), bson.M{}).Decode(&results)
// 	return results
// }

// type Document interface {
// 	User
// }

func (r Repository) AddOne(collName string, doc interface{}) (*mongo.InsertOneResult, error) {
	coll := r.GetCollection(collName)
	result, insertErr := coll.InsertOne(context.Background(), doc)
	if insertErr != nil {
		panic(insertErr)
		return nil, insertErr
	}
	return result, nil
}

func (r Repository) FindOne(collName string, filter bson.D) *mongo.SingleResult {
	coll := r.GetCollection(collName)
	return coll.FindOne(context.Background(), filter)
}

func (r Repository) UpdateOne(collName string, filter bson.M, fields bson.M) bool {
	coll := r.GetCollection(collName)
	result, err := coll.UpdateOne(context.Background(), filter, fields)
	if err != nil {
	 	panic(err)
	 	return false
	}
	return true
}

var Repo = &Repository{
	Client: ConnectDB(config.MongoURI()),
}
