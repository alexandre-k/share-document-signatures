package models

import (
	// "log"
	"fmt"
	// "net/url"
	// "encoding/base64"
	// "encoding/binary"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/bson"
	// "go.mongodb.org/mongo-driver/bson/primitive"

	// "github.com/google/uuid"
	"github.com/duo-labs/webauthn/webauthn"

	repositories "github.com/alexandre-k/share-document-signatures/server/repositories"
)


// type User struct {
// 	id string `bson:"_id,omitempty"`
// 	username string             `bson:"username,omitempty"`
// 	displayName string             `bson:"displayName,omitempty"`
// 	icon string             `bson:"icon,omitempty"`
// 	publicKey string           `bson:"publicKey,omitempty"`
// 	currentChallenge string           `bson:"currentChallenge,omitempty"`
// }

type User struct {
	Id primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Username string             `json:"username,omitempty" bson:"username, omitempty"`
	DisplayName string             `json:"displayName,omitempty" bson:"displayName,omitempty`
	Icon string             `json:"icon,omitempty" bson:"icon,omitempty`
	PublicKey string           `json:"publicKey,omitempty", bson:"publicKey,omitempty"`
	CurrentChallenge string           `json:"currentChallenge,omitempty" bson:"currentChallenge,omitempty"`
}

// func GetAll() ([]User) {
// 	return repositories.Repo.GetAll("users")
// }

func AddUser(username string) (User, error) {
	user := NewUser(username)
	// var bUser []byte
	fmt.Println("User > ", user)
	// bUser, _ = bson.Marshal(user)
	repositories.Repo.AddOne("users", user)
	return user, nil
}

func GetUserOrCreate(username string) (User, error) {
	user, err := GetUser(username)
	if err != nil {
		fmt.Println("Adding new user instead of fetching")
		return AddUser(username)
	}
	return user, nil
}


//  WebAuthnCredentials webauthn.Credential
func NewUser(username string) User {
	// userUuid := uuid.New().String()
	return User{
		// Id: userUuid,
		Id:       primitive.NewObjectID(),
		Username: username,
		DisplayName: username,
		Icon: "https://cdn.icon-icons.com/icons2/3635/PNG/512/ship_boat_cruise_icon_227545.png",
		PublicKey: "",
		CurrentChallenge: "",
		// Credentials: []webauthn.Credential{},
	}
}

func GetNewUser() User {
	return NewUser("john")
}

func GetUser(username string) (User, error) {
	foundUser := repositories.Repo.FindOne("users", bson.D{{ "username", username}})
	var user User
	err := foundUser.Decode(&user)
	return user, err
}

func UpdateUser(username string, fields bson.M) bool {
	ok := repositories.Repo.UpdateOne("users", bson.M{ "username": username}, fields)
	return ok
}

func (u User) WebAuthnID() []byte {
	bId, err := u.Id.MarshalJSON()
	if err != nil {
		fmt.Println("Unable to marshal id: ", err)
	}
	return bId
}


func (u User) WebAuthnName() string {
	return u.Username
}

func (u User) WebAuthnDisplayName() string {
	return u.DisplayName
}

func (u User) WebAuthnIcon() string {
	return u.Icon
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

