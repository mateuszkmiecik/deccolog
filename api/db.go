package main

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"strconv"
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

// Items

type Item struct {
	Id          int       `json:"id"`
	Name        string    `json:"name"`
	FingerPrint string    `json:"fingerprint"`
	PhotoUrl    string    `json:"photoUrl"`
	CreatedAt   time.Time `json:"createdAt"`
	Tags        []TagItem `json:"tags"`
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

func fail(err error) (int64, error) {
	return 0, fmt.Errorf("createNewItem: %v", err)
}

var insertStmt = "INSERT into items(name, fingerprint, catalog_id, photo_url, fingerprint_bigint) VALUES ($1, $2, $3, $4, $5) RETURNING id"

func (c DBService) CreateNewItem(payload PostNewItemPayload, catalogId int, ctx context.Context) (int64, error) {
	tx, err := c.DB.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fail(err)
	}
	// Defer a rollback in case anything fails.
	defer tx.Rollback()

	var itemID int64
	fingerPrintBigInt, err := binaryToBigInt(payload.Fingerprint)
	if err != nil {
		return fail(err)
	}

	if err := c.DB.QueryRow(insertStmt, payload.Name, payload.Fingerprint, catalogId, payload.PhotoUrl, fingerPrintBigInt).Scan(&itemID); err != nil {
		fmt.Println(err)
		return itemID, err
	}

	for _, t := range payload.Tags {
		var tID int64
		// check if tag exists

		query := `SELECT id from tags where id = $1`
		err := tx.QueryRowContext(ctx, query, t).Scan(&tID)
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("tag id %d does not exist", t)
		}
		if err != nil {
			return 0, fmt.Errorf("lookup tag: %w", err)
		}

		insertJoin := `INSERT INTO items_tags(item_id, tag_id) VALUES($1, $2)`
		_, err = tx.ExecContext(ctx, insertJoin, itemID, tID)
		if err != nil {
			return 0, fmt.Errorf("insert join: %w", err)
		}

	}

	// Commit the transaction.
	if err = tx.Commit(); err != nil {
		return fail(err)
	}
	return itemID, nil
}

const (
	HashWidth  = 9  // Required for 8 comparisons
	HashHeight = 8  // 8 rows of comparisons
	HashBits   = 64 // 8 * 8 = 64
)

func binaryToBigInt(hexString string) (int64, error) {
	if len(hexString) != 16 {
		return 0, fmt.Errorf("binary string must be exactly %d bits long", HashBits)
	}

	uint64Hash, err := strconv.ParseUint(hexString, 16, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse hex string %s: %w", hexString, err)
	}

	bigIntHash := int64(uint64Hash)

	return bigIntHash, nil
}

// Tags

func (c DBService) GetTagsByQuery(catalogId int, query string) ([]TagItem, error) {
	// Search for tags that match the query (case-insensitive partial match)
	result, err := c.DB.Query(
		"select id, name from tags where catalog_id = $1 and name ILIKE $2 order by name limit 10",
		catalogId,
		"%"+query+"%",
	)
	if err != nil {
		return []TagItem{}, err
	}
	defer result.Close()

	var tags = []TagItem{}
	for result.Next() {
		var tag TagItem
		if err := result.Scan(&tag.Id, &tag.Name); err != nil {
			return []TagItem{}, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

type TagItem struct {
	Id   int64  `json:"id"`
	Name string `json:"name"`
}

func (c DBService) GetItemByName(name string) (int64, error) {
	var tagID int64
	query := `SELECT id FROM tags WHERE name = $1`
	err := c.DB.QueryRow(query, name).Scan(&tagID)
	if err == sql.ErrNoRows {
		return 0, fmt.Errorf("tag with name %s does not exist", name)
	}
	if err != nil {
		return 0, fmt.Errorf("lookup tag: %w", err)
	}
	return tagID, nil
}

func (c DBService) InsertNewTag(catalogId int, tagName string) (int64, error) {
	existingID, err := c.GetItemByName(tagName)

	if err == nil {
		return existingID, nil
	}

	var id int64
	err = c.DB.QueryRow("INSERT into tags(catalog_id, name) VALUES ($1, $2) returning id", catalogId, tagName).Scan(&id)
	return id, err
}
