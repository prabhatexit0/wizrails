.PHONY: setup wasm dev build preview clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies (Rust wasm-pack + npm)
	@command -v wasm-pack >/dev/null 2>&1 || { echo "Installing wasm-pack..."; cargo install wasm-pack; }
	cd frontend && npm install

wasm: ## Build the WASM engine
	cd wasm-engine && wasm-pack build --target web

dev: wasm ## Build WASM then start Vite dev server
	cd frontend && npm run dev

build: wasm ## Full production build (WASM + frontend)
	cd frontend && npm run build

preview: build ## Production build + preview server
	cd frontend && npm run preview

lint: ## Lint the frontend code
	cd frontend && npm run lint

clean: ## Remove build artifacts
	rm -rf frontend/dist frontend/node_modules
	rm -rf wasm-engine/pkg wasm-engine/target
