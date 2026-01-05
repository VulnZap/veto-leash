.PHONY: build run test clean install

BINARY_NAME=veto
VERSION=3.0.0

build:
	go build -ldflags="-s -w" -o ../$(BINARY_NAME) ./cmd/veto

run:
	go run ./cmd/veto

test:
	go test ./...

clean:
	rm -f ../$(BINARY_NAME) $(BINARY_NAME) $(BINARY_NAME)-*

install: build
	cp ../$(BINARY_NAME) /usr/local/bin/

# Cross-compilation
build-all:
	GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o $(BINARY_NAME)-darwin-arm64 ./cmd/veto
	GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o $(BINARY_NAME)-darwin-amd64 ./cmd/veto
	GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o $(BINARY_NAME)-linux-amd64 ./cmd/veto
	GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o $(BINARY_NAME)-linux-arm64 ./cmd/veto
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o $(BINARY_NAME)-windows-amd64.exe ./cmd/veto
