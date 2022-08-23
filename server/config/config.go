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

func Hostname() string {
	hostname := ""
	// hostname := os.Getenv("HOSTNAME")
	if hostname == "" {
		return "localhost"
	} else {
		return hostname
	}
}

func RelyingParty() string {
	rp := os.Getenv("RELYING_PARTY")
	if rp == "" {
		return "localhost"
	} else {
		return rp
	}
}

func RpIcon() string {
	return "https://duo.com/logo.png"
}
