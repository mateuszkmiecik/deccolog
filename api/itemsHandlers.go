package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type PostNewItemPayload struct {
	Name        string `json:"name"`
	Fingerprint string `json:"fingerprint"`
	PhotoUrl    string `json:"photoUrl"`
	Tags        []int  `json:"tags"`
}

type UpdateItemTagsPayload struct {
	Tags []int `json:"tags"`
}

func getItemPayloadFromBody(b io.ReadCloser) (PostNewItemPayload, error) {
	var p PostNewItemPayload
	if err := json.NewDecoder(b).Decode(&p); err != nil {
		return PostNewItemPayload{}, err
	}
	return p, nil
}

func checkNewItemValidity(payload PostNewItemPayload) bool {
	return true
}

func createItemsCollectionHandler(d DBService) CollectionRequestHandler {
	return func(w http.ResponseWriter, r *http.Request, catalogId int) {

		// Use a timeout context for the DB operation
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		if r.Method == "GET" {
			items, err := d.getAllItems(catalogId)
			if err != nil {
				fmt.Println(err)
				http.Error(w, "There was a problem with getting items", http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(items)
			return
		}

		if r.Method == "POST" {
			newItemPayload, err := getItemPayloadFromBody(r.Body)
			if err != nil {
				fmt.Println(err)
				http.Error(w, "There was a problem with parsing body", http.StatusBadRequest)
				return
			}
			valid := checkNewItemValidity(newItemPayload)

			if !valid {
				http.Error(w, "Item is invalid", http.StatusBadRequest)
				return
			}

			id, err := d.CreateNewItem(newItemPayload, catalogId, ctx)
			if err != nil {
				fmt.Println(err)
				http.Error(w, "createItemsCollectionHandler: "+err.Error(), http.StatusBadRequest)
				return
			}
			json.NewEncoder(w).Encode(id)
			return
		}
	}
}

func createItemsResourceHandler(d DBService) ResourceRequestHandler {
	return func(w http.ResponseWriter, r *http.Request, catalogId int, id int) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		if r.Method == "PUT" {
			var payload UpdateItemTagsPayload
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			if err := d.UpdateItemTags(id, catalogId, payload.Tags, ctx); err != nil {
				fmt.Println(err)
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
			return
		}

		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
