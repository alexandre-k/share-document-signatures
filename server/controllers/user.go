package controllers

import (
	"fmt"
	"encoding/json"
	"net/http"
	"github.com/gin-gonic/gin"

	models "github.com/alexandre-k/share-document-signatures/server/models"
	// "go.mongodb.org/mongo-driver/bson"
	// "github.com/duo-labs/webauthn/protocol"
)

func AddUser(c *gin.Context) {
	user, uErr := models.GetUserOrCreate("john")
	if uErr != nil {
		fmt.Println("Error while fetching or creating a user")
	}
	jsonUser, jErr := json.Marshal(user)
	if jErr != nil {
		fmt.Println("Error while marshaling user: ", jErr)
	}
	c.JSON(http.StatusOK, string(jsonUser))
}

func GetUserByName(c *gin.Context) {
	username := c.Query("username")
	user, _ := models.GetUser(username)
	c.JSON(http.StatusOK, user)
}

func GetUser(c *gin.Context) {
	username := c.Query("username")
	user, uErr := models.GetUserOrCreate(username)
	// user, uErr := models.GetUser("john")
	if uErr != nil {
		fmt.Println("Error while fetching or creating a user")
	}

	// added := models.AddUser(user)

	// if !added {
	// 	fmt.Println("Unable to register user")
	// }

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}
