package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type PostNewItemPayload struct {
	Name        string `json:"name"`
	Fingerprint string `json:"fingerprint"`
	PhotoUrl    string `json:"photoUrl"`
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
			fmt.Println(newItemPayload)
			id, err := d.createNewItem(newItemPayload, catalogId)
			if err != nil {
				fmt.Println(err)
				http.Error(w, "There was a problem with parsing body", http.StatusBadRequest)
				return
			}
			json.NewEncoder(w).Encode(id)
			return
		}
	}
}

func createItemsResourceHandler(d DBService) ResourceRequestHandler {
	return func(w http.ResponseWriter, r *http.Request, catalogId int, id int) {
		println("resource request", id)
	}
}
