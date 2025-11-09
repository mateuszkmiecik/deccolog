#!/bin/sh

# Generate private key
openssl genrsa -out localhost-key.pem 2048

# Generate certificate signing request
openssl req -new -key localhost-key.pem -out localhost.csr -subj "/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in localhost.csr -signkey localhost-key.pem -out localhost-cert.pem

# Clean up CSR file
rm localhost.csr