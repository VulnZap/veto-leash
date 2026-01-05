.PHONY: build run test clean install

BINARY_NAME=leash
VERSION=2.0.0

build:
	go build -ldflags="-s -w" -o ../$(BINARY_NAME) ./cmd/leash

run:
	go run ./cmd/leash

test:
	go test ./...

clean:
	rm -f ../$(BINARY_NAME) $(BINARY_NAME) $(BINARY_NAME)-*

install: build
	cp ../$(BINARY_NAME) /usr/local/bin/

# Cross-compilation
build-all:
	GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o $(BINARY_NAME)-darwin-arm64 ./cmd/leash
	GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o $(BINARY_NAME)-darwin-amd64 ./cmd/leash
	GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o $(BINARY_NAME)-linux-amd64 ./cmd/leash
	GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o $(BINARY_NAME)-linux-arm64 ./cmd/leash
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o $(BINARY_NAME)-windows-amd64.exe ./cmd/leash
