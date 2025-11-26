package main

// import (
// 	"crypto"
// 	"crypto/hmac"
// 	"encoding/hex"
// 	"fmt"
// 	"net/http"
// )

// func verify(key []byte, hash string) (bool, error) {
// 	sig, err := hex.DecodeString(hash)
// 	if err != nil {
// 		return false, err
// 	}
// 	mac := hmac.New(crypto.SHA256.New, key)
// 	return hmac.Equal(sig, mac.Sum(nil)), nil
// }

// func checkLoggedIn(r *http.Request) bool {
// 	sessionCookie, err := r.Cookie("token")
// 	if err != nil {
// 		sessionCookie = &http.Cookie{}
// 	}

// 	v := sessionCookie.Value
// 	valid, err := verify([]byte("test"), v)
// 	if err != nil {
// 		println(err.Error())
// 		return false
// 	}
// 	fmt.Println(sessionCookie.Expires)
// 	return valid
// }
