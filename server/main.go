package main

import (
	"fmt"
	"net/http"
	"github.com/duo-labs/webauthn/webauthn"
	"github.com/gin-gonic/gin"
	models "github.com/alexandre-k/share-document-signatures/server/models"
)

var (
	web *webauthn.WebAuthn
	err error
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

func main() {
	router := gin.Default()
	router.GET("/api/register", func(c *gin.Context) {
		// user := &user.User{
		// 	ID: "08ec7dee-ba64-41f8-acaf-bcff4577ac44",
		// 	Name: "alex",
		// 	DisplayName: "alex",
		// 	Credentials: []webauthn.Credential{},
		// }
		user := models.NewUser()
    web, err = webauthn.New(&webauthn.Config{
			RPDisplayName: "Duo Labs", // Display Name for your site
			RPID: "localhost", // Generally the FQDN for your site
			RPOrigin: "http://localhost", // The origin URL for WebAuthn requests
			RPIcon: "https://duo.com/logo.png", // Optional icon URL for your site
    })
		options, _, _ := web.BeginRegistration(&user)
    if err != nil {
			fmt.Println(err)
    }
		c.JSON(http.StatusOK, gin.H{
			"options": options,
			// "message": "ok",
		})
	})

	router.Run(":4000")
}
