package main

import (
	"github.com/gin-gonic/gin"
	routes "github.com/alexandre-k/share-document-signatures/server/routes"
	config "github.com/alexandre-k/share-document-signatures/server/config"
)

func main() {
	config.ConnectDB(config.MongoURI())

	router := gin.Default()
	v1 := r.Group("/api")
	routes.FidoRegister(v1.Group("/fido"))
	// routes.FidoRoutes(router)

	router.Run(":4000")
	// defer client.Disconnect(ctx)
}
