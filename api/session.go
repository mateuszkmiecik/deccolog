package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "dev-secret"))

func getTokenCookie(r *http.Request) (*http.Cookie, error) {
	return r.Cookie("token")
}

func sessionChecker(r *http.Request, onSuccess func(*jwt.RegisteredClaims), onFailure func()) bool {
	c, err := getTokenCookie(r)
	if err != nil {
		onFailure()
		return false
	}
	claims, err := validateToken(c.Value)
	if err != nil {
		fmt.Println("invalid token: "+err.Error(), http.StatusUnauthorized)
		onFailure()
		return false
	}
	onSuccess(claims)
	return true
}

// validateToken parses and verifies the token, returning RegisteredClaims on success.
func validateToken(tokenStr string) (*jwt.RegisteredClaims, error) {
	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		// ensure expected signing method
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	// you can add extra checks on claims here if desired
	return claims, nil
}

func setSessionToken(w http.ResponseWriter, json string) {

	// Create token with standard claims and a custom "sub" (subject)
	claims := jwt.RegisteredClaims{
		Subject:   json,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 60 * time.Minute)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(jwtSecret)

	if err != nil {
		http.Error(w, "failed to sign token", http.StatusInternalServerError)
		return
	}

	println(signed)

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    signed,
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Now().Add(24 * 100 * time.Hour),
	})

}
