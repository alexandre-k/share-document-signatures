package controllers

import (
	"encoding/json"
	// "crypto/subtle"
	// "crypto/sha256"
	"log"
	// "encoding/base64"
	"fmt"

	"github.com/duo-labs/webauthn.io/session"
	"github.com/duo-labs/webauthn/webauthn"
	"github.com/duo-labs/webauthn/protocol"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"io/ioutil"
	"net/http"

	models "github.com/alexandre-k/share-document-signatures/server/models"
	config "github.com/alexandre-k/share-document-signatures/server/config"
	"go.mongodb.org/mongo-driver/bson"
)

var (
	web    *webauthn.WebAuthn
	client *mongo.Client
	sessionStore *session.Store
	err    error
)

type Params struct {
	Username string `json:"username,omitempty"`
	Challenge string `json:"challenge,omitempty"`
}

func Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ping": "pong"})
}

func GetParams(c *gin.Context) (Params, gin.H) {
	       jsonBlob, err := ioutil.ReadAll(c.Request.Body)
	       if err != nil {
					 return Params{Username: ""}, gin.H{"error": "Incorrect body."}
		       }
	       var reqBody Params
	       bodyErr := json.Unmarshal(jsonBlob, &reqBody)
	       if bodyErr != nil {
					 return Params{Username: ""}, gin.H{"error": "Incorrect json."}
		       }
	       if reqBody.Username == "" {
					 return Params{Username: ""}, gin.H{"error": "No username found."}
		       }
	       return reqBody, nil
	}

func Register(c *gin.Context) {
	       params, pErr := GetParams(c)
	       if pErr != nil {
		               c.JSON(http.StatusNotFound, pErr)
		               return
		       }

	user, uErr := models.GetUserOrCreate(params.Username)
	if uErr != nil {
		fmt.Println("Error while fetching or creating a user")
	}
	web, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "Duo Labs",                 // Display Name for your site
		RPID:          config.Hostname(),                // Generally the FQDN for your site
		RPOrigin:      config.RelyingParty(),         // The origin URL for WebAuthn requests
		RPIcon:        config.RpIcon(), // Optional icon URL for your site
	})
	options, sessionData, err := web.BeginRegistration(&user)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to begin the registration"})
	}

	sessionStore, err = session.NewStore()
	if err != nil {
		log.Fatal("failed to create session store:", err)
	}

	// store session data as marshaled JSON
	err = sessionStore.SaveWebauthnSession("registration", sessionData, c.Request, c.Writer)
	updated := models.UpdateUser(user.Username, bson.M{ "$set": bson.M{"sessionData": sessionData} })

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unable to find user while updating"})
		return
	}

	if err != nil {
		fmt.Println(err)
	}

	c.JSON(http.StatusOK, gin.H{
		"options": options,
	})
}

type VerifyCredential struct {
  protocol.CredentialCreationResponse
	Username string
}

func VerifyRegistration(c *gin.Context) {

	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{ "error": "No username given."})
		return
	}

	user, uErr := models.GetUser(username)
	if uErr != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Could not fetch a user identified by the given username. Did you register it?"})
		return
	}

	// load the session data
	session, err := sessionStore.GetWebauthnSession("registration", c.Request)
	if err != nil {
		log.Println(err)
		return
	}

	// Verify that the challenge succeeded
	cred, vErr := web.FinishRegistration(&user, session, c.Request)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to verify the challenge"})
		return
	}

	updated := models.UpdateUser(user.Username, bson.M{ "$set": bson.M{"credentials": []webauthn.Credential{*cred}} })

	if !updated {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unable to save credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{ "credential": cred })
}

func Login(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{ "error": "No username given."})
		return
	}

	user, uErr := models.GetUser(username)
	if uErr != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Could not fetch a user identified by the given username. Did you register it?"})
		return
	}

	options, session, err := web.BeginLogin(user)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{ "error": "Unable to get credential to start login"})
		return
	}
	// store session data as marshaled JSON
	err = sessionStore.SaveWebauthnSession("authentication", session, c.Request, c.Writer)
	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{ "error": "Unable to save session" })
		return
	}

	c.JSON(http.StatusOK, options)
}
