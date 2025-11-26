package main

import (
	"crypto/md5"
	"database/sql"
	"encoding/base64"
	"log"
	"os"
)

func initializeDB() *sql.DB {
	connString := os.Getenv("DATABASE_URL")
	db, dbErr := sql.Open("postgres", connString)
	if dbErr != nil {
		log.Fatalln(dbErr.Error())
		panic(dbErr)
	}
	return db
}

type CatalogDBService struct {
	DB *sql.DB
}

type Catalog struct {
	Id       int
	Name     string
	Password string
}

func (c CatalogDBService) findCatalogByPasswordHash(password string) (Catalog, error) {
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

// 	return catalogs
// }
