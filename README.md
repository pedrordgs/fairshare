# FairShare - WIP

An open-source expense splitting and settlement tracking application. Split bills fairly, track shared expenses, and settle up with friends.

## Overview

FairShare helps groups of friends, roommates, or colleagues manage shared expenses effortlessly. Whether you're splitting a dinner bill, tracking rent and utilities, or managing group trips, FairShare makes it easy to see who owes what and settle up.

## Getting Started

Start all services:

```bash
docker compose up --build
```

**Services:**

| Service | URL |
|---------|-----|
| Web (React) | http://localhost:5173 |
| API (FastAPI) | http://localhost:8001 |
| API Docs | http://localhost:8001/docs |
| pgAdmin | http://localhost:8081 |

For package-specific details, see [web/README.md](web/README.md) and [api/README.md](api/README.md).

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

When contributing:
1. Follow the existing code patterns
2. Write tests for new functionality
3. Update documentation as needed
4. Ensure code passes linting
