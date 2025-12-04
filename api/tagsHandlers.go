package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func createTagsCollectionHandler(d DBService) CollectionRequestHandler {
	return func(w http.ResponseWriter, r *http.Request, catalogId int) {
		if r.Method != "GET" && r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if r.Method == "POST" {
			createTagHandler(w, r, catalogId, d)
			return
		}

		query := r.URL.Query().Get("q")
		if query == "" {
			http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
			return
		}

		tags, err := d.GetTagsByQuery(catalogId, query)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Failed to fetch tags", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tags)
	}
}

func createTagsResourceHandler(d DBService) ResourceRequestHandler {
	return func(w http.ResponseWriter, r *http.Request, catalogId, id int) {

	}
}

func createTagHandler(w http.ResponseWriter, r *http.Request, catalogId int, d DBService) {
	body := make([]byte, r.ContentLength)
	r.Body.Read(body)
	tagName := string(body)

	id, err := d.InsertNewTag(catalogId, tagName)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Could not create a tag", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(TagItem{id, tagName})
}
