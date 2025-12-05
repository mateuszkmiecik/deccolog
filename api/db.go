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
	query := `
		SELECT i.id, i.name, i.fingerprint, i.photo_url, i.created_at, t.id, t.name
		FROM items i
		LEFT JOIN items_tags it ON i.id = it.item_id
		LEFT JOIN tags t ON it.tag_id = t.id
		WHERE i.catalog_id = $1
		ORDER BY i.id, t.name
	`
	result, err := c.DB.Query(query, catalogId)
	if err != nil {
		return []Item{}, err
	}
	defer result.Close()

	// Use a map to group tags by item ID
	itemsMap := make(map[int]*Item)
	var itemOrder []int

	for result.Next() {
		var itemId int
		var name, fingerprint string
		var photoUrl sql.NullString
		var createdAt time.Time
		var tagId sql.NullInt64
		var tagName sql.NullString

		if err := result.Scan(&itemId, &name, &fingerprint, &photoUrl, &createdAt, &tagId, &tagName); err != nil {
			return []Item{}, err
		}

		item, exists := itemsMap[itemId]
		if !exists {
			item = &Item{
				Id:          itemId,
				Name:        name,
				FingerPrint: fingerprint,
				PhotoUrl:    photoUrl.String,
				CreatedAt:   createdAt,
				Tags:        []TagItem{},
			}
			itemsMap[itemId] = item
			itemOrder = append(itemOrder, itemId)
		}

		if tagId.Valid && tagName.Valid {
			item.Tags = append(item.Tags, TagItem{Id: tagId.Int64, Name: tagName.String})
		}
	}

	// Build result slice preserving order
	items := make([]Item, 0, len(itemOrder))
	for _, id := range itemOrder {
		items = append(items, *itemsMap[id])
	}

	return items, nil
}

func (c DBService) getTagsForItem(itemId int) ([]TagItem, error) {
	result, err := c.DB.Query(`
		SELECT t.id, t.name 
		FROM tags t 
		INNER JOIN items_tags it ON t.id = it.tag_id 
		WHERE it.item_id = $1
		ORDER BY t.name
	`, itemId)
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

	if err := tx.QueryRowContext(ctx, insertStmt, payload.Name, payload.Fingerprint, catalogId, payload.PhotoUrl, fingerPrintBigInt).Scan(&itemID); err != nil {
		fmt.Println(err)
		return itemID, err
	}

	for _, t := range payload.Tags {
		var tID int64
		// Verify tag exists and belongs to the same catalog
		query := `SELECT id FROM tags WHERE id = $1 AND catalog_id = $2`
		err := tx.QueryRowContext(ctx, query, t, catalogId).Scan(&tID)
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("tag id %d does not exist in catalog", t)
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

func (c DBService) GetTagByNameInCatalog(catalogId int, name string) (int64, error) {
	var tagID int64
	query := `SELECT id FROM tags WHERE name = $1 AND catalog_id = $2`
	err := c.DB.QueryRow(query, name, catalogId).Scan(&tagID)
	if err == sql.ErrNoRows {
		return 0, fmt.Errorf("tag with name %s does not exist in catalog", name)
	}
	if err != nil {
		return 0, fmt.Errorf("lookup tag: %w", err)
	}
	return tagID, nil
}

func (c DBService) InsertNewTag(catalogId int, tagName string) (int64, error) {
	existingID, err := c.GetTagByNameInCatalog(catalogId, tagName)

	if err == nil {
		return existingID, nil
	}

	var id int64
	err = c.DB.QueryRow("INSERT into tags(catalog_id, name) VALUES ($1, $2) returning id", catalogId, tagName).Scan(&id)
	return id, err
}

func (c DBService) UpdateItemTags(itemId int, catalogId int, tagIds []int, ctx context.Context) error {
	tx, err := c.DB.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("UpdateItemTags begin tx: %w", err)
	}
	defer tx.Rollback()

	// Verify item belongs to catalog
	var existingItemId int
	err = tx.QueryRowContext(ctx, "SELECT id FROM items WHERE id = $1 AND catalog_id = $2", itemId, catalogId).Scan(&existingItemId)
	if err == sql.ErrNoRows {
		return fmt.Errorf("item %d not found in catalog %d", itemId, catalogId)
	}
	if err != nil {
		return fmt.Errorf("UpdateItemTags verify item: %w", err)
	}

	// Delete existing tags for this item
	_, err = tx.ExecContext(ctx, "DELETE FROM items_tags WHERE item_id = $1", itemId)
	if err != nil {
		return fmt.Errorf("UpdateItemTags delete existing: %w", err)
	}

	// Insert new tags
	for _, tagId := range tagIds {
		// Verify tag exists and belongs to the same catalog
		var tID int64
		err := tx.QueryRowContext(ctx, "SELECT id FROM tags WHERE id = $1 AND catalog_id = $2", tagId, catalogId).Scan(&tID)
		if err == sql.ErrNoRows {
			return fmt.Errorf("tag id %d does not exist in catalog", tagId)
		}
		if err != nil {
			return fmt.Errorf("UpdateItemTags lookup tag: %w", err)
		}

		_, err = tx.ExecContext(ctx, "INSERT INTO items_tags(item_id, tag_id) VALUES($1, $2)", itemId, tagId)
		if err != nil {
			return fmt.Errorf("UpdateItemTags insert join: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("UpdateItemTags commit: %w", err)
	}
	return nil
}
