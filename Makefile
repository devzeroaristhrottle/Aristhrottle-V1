.PHONY: build start stop restart logs ps health init clean build-with-env

# Build all services
build:
	docker-compose build

# Build with environment variables from .env file
build-with-env:
	@echo "Building with environment variables from .env file"
	docker-compose --env-file  env.production build

# Start services in detached mode
start:
	docker-compose --env-file env.production up -d

# Stop all services
stop:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# View logs of all services
logs:
	docker-compose logs -f

# Show running containers
ps:
	docker-compose ps

# Check health endpoint
health:
	curl -f http://localhost:3000/api/health


# Clean up unused Docker resources
clean:
	docker-compose down -v
	docker system prune -f 