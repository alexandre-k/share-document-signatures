package main

import (
	routes "github.com/alexandre-k/share-document-signatures/server/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	v1 := router.Group("/api")
	routes.FidoRegister(v1.Group("/fido"))
	router.Run(":4000")
}
