package main

import (
	"crypto/md5"
	"database/sql"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func initializeDB() *sql.DB {
	connString := os.Getenv("DATABASE_URL")
	db, dbErr := sql.Open("postgres", connString+"?parseTime=true")
	if dbErr != nil {
		log.Fatalln(dbErr.Error())
		panic(dbErr)
	}
	return db
}

type DBService struct {
	DB *sql.DB
}

type Catalog struct {
	Id       int
	Name     string
	Password string
}

func (c DBService) findCatalogByPasswordHash(password string) (Catalog, error) {
	hash := md5.Sum([]byte(password))
	hashedPassword := base64.StdEncoding.EncodeToString(hash[:])

	row := c.DB.QueryRow("select id, name from catalogs where password = $1", hashedPassword)
	var cat Catalog
	if err := row.Scan(&cat.Id, &cat.Name); err != nil {
		return Catalog{}, err
	}
	return cat, nil
}

// func getCatalogs(db *sql.DB) []Catalog {
// 	result, err := db.Query("select id, name, password from catalogs")
// 	if err != nil {
// 		log.Fatal(err)
// 	}
// 	catalogs := []Catalog{}
// 	for result.Next() {
// 		var r Catalog
// 		result.Scan(&r.Id, &r.Name, &r.Password)
// 		catalogs = append(catalogs, r)
// 	}

//		return catalogs
//	}

type Item struct {
	Id          int       `json:"id"`
	Name        string    `json:"name"`
	FingerPrint string    `json:"fingerprint"`
	PhotoUrl    string    `json:"photoUrl"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (c DBService) getAllItems(catalogId int) ([]Item, error) {
	result, err := c.DB.Query("select id, name, fingerprint, photo_url, created_at from items where catalog_id = $1", catalogId)
	if err != nil {
		return []Item{}, err
	}
	defer result.Close()
	// colTypes, err := result.ColumnTypes()
	// for c := colTypes {
	// 	fmt.Println(c)
	// }
	var items = []Item{}

	for result.Next() {
		var i Item
		result.Scan(&i.Id, &i.Name, &i.FingerPrint, &i.PhotoUrl, &i.CreatedAt)
		items = append(items, i)
	}

	return items, nil
}

var insertStmt = "INSERT into items(name, fingerprint, catalog_id, photo_url) VALUES ($1, $2, $3, $4) RETURNING id"

func (c DBService) createNewItem(payload PostNewItemPayload, catalogId int) (int64, error) {
	println("creating new item")
	result, err := c.DB.Exec(insertStmt, payload.Name, payload.Fingerprint, catalogId, payload.PhotoUrl)
	if err != nil {
		fmt.Println(err)
		return -1, err
	}
	id, err := result.LastInsertId()
	return id, nil
}
