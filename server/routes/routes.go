package routes

import (
	controllers "github.com/alexandre-k/share-document-signatures/server/controllers"
	"github.com/gin-gonic/gin"
)

func FidoRegister(router *gin.RouterGroup) {
	router.GET("/ping", controllers.Ping)
	router.POST("/register", controllers.Register)
	router.POST("/register/:username/verify", controllers.VerifyRegistration)
	router.GET("/user", controllers.GetUser)
	router.POST("/user", controllers.AddUser)
}

// func FidoRoutes(router *gin.Engine) {

// }
