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

test-e2e: ## Run e2e against a throwaway Postgres container (Compose untouched)
	bash ./scripts/run-e2e.sh

migrate: ## Apply TypeORM migrations (needs local DATABASE_* / toca-postgres)
	pnpm run migration:run

up: ## Build, start api + db, wait until API is healthy
	@bash ./scripts/check-compose-db-name.sh
	docker compose up --build -d --wait
	@echo "API ready at http://localhost:8080"

down: ## Stop stack and remove containers, networks, volumes, and built images
	docker compose down -v --rmi local --remove-orphans

logs: ## Follow api container logs
	docker compose logs -f api

health: ## Probe GET /health on localhost:8080
	curl -sS http://localhost:8080/health
	@echo
