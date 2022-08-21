package controllers

import (
	"io/ioutil"
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"github.com/duo-labs/webauthn/webauthn"

	models "github.com/alexandre-k/share-document-signatures/server/models"
	// "go.mongodb.org/mongo-driver/bson"
	// "github.com/duo-labs/webauthn/protocol"
)

// func BeginRegistration(w http.ResponseWriter, r *http.Request) {
	// user := datastore.GetUser() // Find or create the new user
	// user := User { id: "08ec7dee-ba64-41f8-acaf-bcff4577ac44", username: "alex" }
	// options, _, _ := web.BeginRegistration(&user)
	// handle errors if present
	// store the sessionData values
	// return options
	// JSONResponse(w, options, http.StatusOK) // return the options generated
	// options.publicKey contain our registration options
//}

// func FinishRegistration(w http.ResponseWriter, r *http.Request) {
// 	user := User { id: "08ec7dee-ba64-41f8-acaf-bcff4577ac44", username: "alex" }
// 	// Get the session data stored from the function above
// 	// using gorilla/sessions it could look like this
// 	user := User { id: "08ec7dee-ba64-41f8-acaf-bcff4577ac44", username: "alex" }
// 	parsedResponse, err := protocol.ParseCredentialCreationResponseBody(r.Body)
// 	credential, err := web.CreateCredential(&user, user.currentChallenge, parsedResponse)
// 	// Handle validation or input errors
// 	// If creation was successful, store the credential object
// 	JSONResponse(w, "Registration Success", http.StatusOK) // Handle next steps
// }

var (
	web *webauthn.WebAuthn
	client *mongo.Client
	err error
)

func Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{ "ping": "pong" })
}

func Register(c *gin.Context) {
	user, uErr := models.GetUserOrCreate("john")
	if uErr != nil {
		fmt.Println("Error while fetching or creating a user")
	}
	web, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "Duo Labs", // Display Name for your site
		RPID: "localhost", // Generally the FQDN for your site
		RPOrigin: "http://localhost", // The origin URL for WebAuthn requests
		RPIcon: "https://duo.com/logo.png", // Optional icon URL for your site
	})
	options, sessionData, _ := web.BeginRegistration(&user)

	// added := models.AddUser(user)

	// if !added {
	// 	fmt.Println("Unable to register user")
	// }

	// fmt.Println("SESSION DATA > ", sessionData)
	// fmt.Println("OPTIONS > ", options)

	if err != nil {
		fmt.Println(err)
	}


	c.JSON(http.StatusOK, gin.H{
		"options": options,
		// "message": "ok",
	})
}

func VerifyRegistration(c *gin.Context) {
    // user := datastore.GetUser() // Get the user
    // Get the session data stored from the function above
    // using gorilla/sessions it could look like this

		jsonData, err := ioutil.ReadAll(c.Request.Body);
		if err != nil {
			fmt.Println("Error: ", err)
		}
		fmt.Println("json: ", jsonData)
	c.JSON(http.StatusOK, gin.H{"message": "not implemented"})
		// fmt.Println(jsonData.clientDataJSON)

		// filter := bson.M{ "currentChallenge": bson.M{ "$eq": sessionData.Challenge, } }
		// update := bson.M{ "$set": bson.M{ "currentChallenge": sessionData.Challenge }}
		// users.UpdateOne(ctx.Background(), filter, update)
    // sessionData := store.Get(r, "registration-session")
    // parsedResponse, err := protocol.ParseCredentialCreationResponseBody(r.Body)
    // credential, err := web.CreateCredential(&user, sessionData, parsedResponse)
    // Handle validation or input errors
    // If creation was successful, store the credential object
    // JSONResponse(w, "Registration Success", http.StatusOK) // Handle next steps
}
