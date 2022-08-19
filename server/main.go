package main

import (
	"github.com/gin-gonic/gin"
	routes "github.com/alexandre-k/share-document-signatures/server/routes"
)

func main() {
	router := gin.Default()
	v1 := router.Group("/api")
	routes.FidoRegister(v1.Group("/fido"))
	router.Run(":4000")
}
