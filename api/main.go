package main

import (
	"io"
	"log"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {

	if err := godotenv.Load(".env"); err != nil {
		println("Error loading .env file", err.Error())
	}

	fmt.Println(base64.StdEncoding.EncodeToString([]byte("test2")))

	port := getPortFromEnv()
	fmt.Println("Server listening at: localhost:" + string([]byte(port)))

	db := initializeDB()
	cm := CatalogDBService{db}

	// static assets
	fs := http.FileServer(http.Dir("dist/assets"))
	http.Handle("/assets/", http.StripPrefix("/assets/", fs))

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/login", loginHandler(cm))
	http.HandleFunc("/api/", apiHandler)

	port = ":" + port
	err := http.ListenAndServe(port, nil)
	fmt.Println(err) // don't ignore errors
}

// app

func homeHandler(w http.ResponseWriter, r *http.Request) {
	onSuccess := func(claims *jwt.RegisteredClaims) {
		println(claims)
		fileHandlerFactory("index.html")(w, r)
	}

	onFailure := func() {
		http.Redirect(w, r, "/login", http.StatusFound)
	}

	sessionChecker(r, onSuccess, onFailure)
}

type PostPayload struct {
	Password string `json:"password"`
}

func getPasswordFromBody(b io.ReadCloser) (string, error) {
	var p PostPayload
	if err := json.NewDecoder(b).Decode(&p); err != nil {
		return "", err
	}
	return p.Password, nil
}

func loginHandler(cm CatalogDBService) func(w http.ResponseWriter, r *http.Request) {

	return func(w http.ResponseWriter, r *http.Request) {

		sessionChecker(r, func(rc *jwt.RegisteredClaims) {
			http.Redirect(w, r, "/", http.StatusFound)
		}, func() {
			switch r.Method {
			case "GET":
				loginPageHandler := fileHandlerFactory("login.html")
				loginPageHandler(w, r)
				return

			case "POST":
				// set cors
				w.Header().Set("Access-Control-Allow-Origin", "*")

				password, err := getPasswordFromBody(r.Body)
				if err != nil {
					log.Printf("Error getPasswordFromBody: %s", err)
					http.Error(w, "Bad request", http.StatusBadRequest)
					return
				}

				if len(password) == 0 {
					log.Printf("Empty password")
					http.Error(w, "Bad request", http.StatusBadRequest)
					return
				}

				catalog, err := cm.findCatalogByPasswordHash(password)
				if err != nil {
					log.Printf("Error cm.findCatalogByPasswordHash: %s", err)
					http.Error(w, "Unathorized", http.StatusUnauthorized)
					return
				}

				catalogAsJson, _ := json.Marshal(&catalog)
				fmt.Println(string(catalogAsJson))
				setSessionToken(w, string(catalogAsJson))

				type ResponsePayload struct {
					Success bool `json:"success"`
				}

				json.NewEncoder(w).Encode(ResponsePayload{Success: true})
				return

			default:
				http.Error(w, "Not found", http.StatusNotFound)
				return
			}
		})
	}
}

// helpers

func fileHandlerFactory(fileName string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")

		file, err := os.ReadFile("dist/" + fileName)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		w.Write(file)
	}
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	var claims *jwt.RegisteredClaims
	authenticated := sessionChecker(r, func(rc *jwt.RegisteredClaims) {
		claims = rc
	}, func() {})

	if !authenticated {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	fmt.Println(claims.Subject)

	pathSegment := r.URL.Path[len("/api"):]

	fmt.Println(r.Method)
	fmt.Println("path", pathSegment)
	fmt.Println(r.Cookie("session"))
	fmt.Fprintf(w, "/api")
}
