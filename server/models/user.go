package models

import (
	// "encoding/base64"
	"encoding/binary"

	// "go.mongodb.org/mongo-driver/bson"
	// "go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/google/uuid"
	"github.com/duo-labs/webauthn/webauthn"
)

type User struct {
	id uint32 `bson:"_id,omitempty"`
	username string             `bson:"username,omitempty"`
	displayName string             `bson:"displayName,omitempty"`
	icon string             `bson:"icon,omitempty"`
	publicKey string           `bson:"publicKey,omitempty"`
	currentChallenge string           `bson:"currentChallenge,omitempty"`
}

//  WebAuthnCredentials webauthn.Credential
func NewUser() User {
	u := User{
		id: uuid.New().ID(),
		username: "john",
		displayName: "john",
		icon: "https://cdn.icon-icons.com/icons2/3635/PNG/512/ship_boat_cruise_icon_227545.png",
		publicKey: "",
		currentChallenge: "",
	}
	return u
}



func (u User) WebAuthnID() []byte {
	buf := make([]byte, binary.MaxVarintLen64)
	binary.PutUvarint(buf, uint64(u.id))
	return buf
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

