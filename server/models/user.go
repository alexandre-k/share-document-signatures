package models

import (
	"context"
	// "net/url"
	// "encoding/base64"
	// "encoding/binary"

	// "go.mongodb.org/mongo-driver/bson"
	// "go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/google/uuid"
	"github.com/duo-labs/webauthn/webauthn"

	repositories "github.com/alexandre-k/share-document-signatures/server/repositories"
)


type User struct {
	id string `bson:"_id,omitempty"`
	username string             `bson:"username,omitempty"`
	displayName string             `bson:"displayName,omitempty"`
	icon string             `bson:"icon,omitempty"`
	publicKey string           `bson:"publicKey,omitempty"`
	currentChallenge string           `bson:"currentChallenge,omitempty"`
}


func AddUser(user User) bool {
	users := repositories.Repo.GetUsers()
	_, insertErr := users.InsertOne(context.Background(), user)
	if insertErr != nil {
		panic(insertErr)
		return false
	}
	return true
}

//  WebAuthnCredentials webauthn.Credential
func NewUser() User {
	userUuid := uuid.New().String()
	u := User{
		id: userUuid,
		username: "john",
		displayName: "john",
		icon: "https://cdn.icon-icons.com/icons2/3635/PNG/512/ship_boat_cruise_icon_227545.png",
		publicKey: "",
		currentChallenge: "",
	}
	return u
}

// func GetUser() User {}



func (u User) WebAuthnID() []byte {
	return []byte(u.id)
}


func (u User) WebAuthnName() string {
	return u.username
}

func (u User) WebAuthnDisplayName() string {
	return u.displayName
}

func (u User) WebAuthnIcon() string {
	return u.icon
}

func (u User) WebAuthnCredentials() []webauthn.Credential {
	// credentials, _ := GetCredentialsForUser(&u)
	// wcs := make([]webauthn.Credential, len(credentials))
	// for i, cred := range credentials {
	// 	credentialID, _ := base64.URLEncoding.DecodeString(cred.CredentialID)
	// 	wcs[i] = webauthn.Credential{
	// 		ID:            credentialID,
	// 		PublicKey:     cred.PublicKey,
	// 		Authenticator: cred.WebauthnAuthenticator(),
	// 	}
	// }
	return []webauthn.Credential{}
}

