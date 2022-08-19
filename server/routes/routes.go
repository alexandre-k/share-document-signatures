package routes

import (
	"github.com/gin-gonic/gin"
	controllers "github.com/alexandre-k/share-document-signatures/server/controllers"
)

func FidoRegister(router *gin.RouterGroup) {
	router.GET("/ping", controllers.Ping)
	router.GET("/register", controllers.Register)
	router.POST("/register/verify", controllers.VerifyRegistration)
}

// func FidoRoutes(router *gin.Engine) {

// }
