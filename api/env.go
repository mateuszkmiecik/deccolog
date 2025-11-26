package main

import "os"

func getPortFromEnv() string {
	val := os.Getenv("PORT")
	if len(val) == 0 {
		val = "3002"
	}
	return val
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
