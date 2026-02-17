# Portfolio API Tests

## Usage

### Basic test (requires JWT token)
```bash
chmod +x test-portfolio.sh
./test-portfolio.sh <your-jwt-token>
```

### With PDF upload
```bash
./test-portfolio.sh <your-jwt-token> /path/to/portfolio.pdf
```

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v0/portfolio` | Get current user's portfolio |
| POST | `/api/v0/portfolio/pdf` | Upload portfolio PDF |
| PUT | `/api/v0/portfolio` | Update portfolio settings |
| DELETE | `/api/v0/portfolio/pdf` | Delete portfolio PDF |

## Getting JWT Token

1. Login via the auth endpoint or use your existing token
2. Copy the `access_token` from the response
3. Pass it as the first argument to the test script
