package main

import (
	"bytes"
	"io"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {

	if err := godotenv.Load(".env"); err != nil {
		println("Error loading .env file", err.Error())
	}

	println("")
	println("--- server starting...")
	fmt.Println(jwt.NewNumericDate(time.Now()))

	port := getPortFromEnv()
	fmt.Println("Server listening at: localhost:" + string([]byte(port)))

	db := initializeDB()
	dbService := DBService{db}

	// static assets
	fs := http.FileServer(http.Dir("dist/assets"))
	http.Handle("/assets/", http.StripPrefix("/assets/", fs))

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/auth/login", authHandler(dbService))
	http.HandleFunc("/api/", createApiHandler(dbService))

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

type PostAuthLoginPayload struct {
	Password string `json:"password"`
}

func getPasswordFromBody(b io.ReadCloser) (string, error) {
	var p PostAuthLoginPayload
	if err := json.NewDecoder(b).Decode(&p); err != nil {
		return "", err
	}
	return p.Password, nil
}

func authHandler(cm DBService) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		switch r.Method {
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
		}

		notFound(w, r)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	sessionChecker(r, func(rc *jwt.RegisteredClaims) {
		http.Redirect(w, r, "/", http.StatusFound)
	}, func() {
		switch r.Method {
		case "GET":
			loginPageHandler := fileHandlerFactory("login.html")
			loginPageHandler(w, r)
			return

		default:
			notFound(w, r)
			return
		}
	})
}

// helpers

func fileHandlerFactory(fileName string) http.HandlerFunc {
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

type SubjectPayload struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

func extractCatalogId(payload string) int {
	var p SubjectPayload
	if err := json.NewDecoder(bytes.NewReader([]byte(payload))).Decode(&p); err != nil {
		return -1
	}
	return p.Id
}
func createApiHandler(d DBService) http.HandlerFunc {
	itemsHandler := createCollectionHandler("/api/items", createItemsCollectionHandler(d), createItemsResourceHandler(d))

	return func(w http.ResponseWriter, r *http.Request) {
		var claims *jwt.RegisteredClaims
		authenticated := sessionChecker(r, func(rc *jwt.RegisteredClaims) {
			claims = rc
		}, func() {})

		if !authenticated {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		catalogId := extractCatalogId(claims.Subject)
		if catalogId <= 0 {
			fmt.Fprintf(w, "Bad request", http.StatusBadRequest)
			return
		}
		fmt.Println(claims.Subject)

		if strings.HasPrefix(r.URL.Path, "/api/items") {
			itemsHandler(w, r, catalogId)
			return
		}

		notFound(w, r)
	}
}

func notFound(w http.ResponseWriter, r *http.Request) {
	msg := strings.Join([]string{r.Method, r.URL.String(), "Not found"}, " ")
	http.Error(w, msg, http.StatusNotFound)
}

type CollectionRequestHandler func(w http.ResponseWriter, r *http.Request, catalogId int)
type ResourceRequestHandler func(w http.ResponseWriter, r *http.Request, catalogId int, id int)
type CollectionHandlerWrapper func(w http.ResponseWriter, r *http.Request, catalogId int)

func createCollectionHandler(prefix string, handleCollectionRequest CollectionRequestHandler, handleResourceRequest ResourceRequestHandler) CollectionHandlerWrapper {
	return func(w http.ResponseWriter, r *http.Request, catalogId int) {
		pathSegment := strings.TrimPrefix(r.URL.Path, prefix)

		w.Header().Set("Content-Type", "application/json")

		if pathSegment == "" || pathSegment == "/" {
			// COLLECTION endpoint: /api/items(/?)
			handleCollectionRequest(w, r, catalogId)
		} else if id, err := strconv.Atoi(strings.TrimPrefix(pathSegment, "/")); err == nil {
			// RESOURCE endpoint: /api/items/{id}
			handleResourceRequest(w, r, catalogId, id)
		} else {
			notFound(w, r)
		}
	}
}
