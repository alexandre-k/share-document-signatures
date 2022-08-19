package config

import "os"

func MongoURI() string {
	MONGODB_HOST := os.Getenv("MONGODB_HOST")
	MONGODB_USERNAME := os.Getenv("MONGODB_USERNAME")
	MONGODB_PASSWORD := os.Getenv("MONGODB_PASSWORD")
	MONGODB_PORT := os.Getenv("MONGODB_PORT")
	MONGODB_URI := "mongodb://" + MONGODB_USERNAME + ":" + MONGODB_PASSWORD + "@" + MONGODB_HOST + ":" + MONGODB_PORT
	return MONGODB_URI
}

func MongoDatabase() string {
	return os.Getenv("MONGODB_DATABASE")
}
