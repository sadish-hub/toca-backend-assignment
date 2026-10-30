.PHONY: help install build lint test test-cov test-e2e migrate up down logs health

help: ## List available targets
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\nTargets:\n"} /^[a-zA-Z0-9_-]+:.*?## / { printf "  %-12s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies with pnpm
	pnpm install

build: ## Compile NestJS to dist/
	pnpm run build

lint: ## Run ESLint
	pnpm run lint

test: ## Run unit tests
	pnpm test

test-cov: ## Run unit tests with coverage thresholds
	pnpm run test:cov

test-e2e: ## Run e2e tests
	pnpm run test:e2e

migrate: ## Apply TypeORM migrations (needs local DATABASE_* / toca-postgres)
	pnpm run migration:run

up: ## Build and start api + db via Docker Compose
	docker compose up --build -d

down: ## Stop Compose stack
	docker compose down

logs: ## Follow api container logs
	docker compose logs -f api

health: ## Probe GET /health on localhost:8080
	curl -sS http://localhost:8080/health
	@echo
