# API Documentation

## Overview

The Applyn CRM API lets you read and write records programmatically using REST endpoints. Authenticate with an **API key** from Settings → API or with a **JWT** from login/signup. Use the Node/MySQL backend to create, list, update, and delete records.

## Base URL

Use your API server URL, for example:

```
http://localhost:3001/api
```

Set **VITE_API_URL** (e.g. `http://localhost:3001`) in the frontend. The records endpoint is `GET/POST/PATCH/DELETE /api/crm_records`.

## Authentication

Send your API key in the request header:

```
X-API-Key: <your-api-key>
```

Create and copy API keys from **Settings → API** in the CRM. Keep keys secret and never expose them in client-side code or public repositories.

## Endpoints

### Records (api-records)

The `api-records` function handles CRUD for CRM records.

| Method | Path / body       | Description                    |
|--------|-------------------|--------------------------------|
| GET    | Query: module_id  | List records for a module      |
| GET    | Query: module_id, record_id | Get one record by ID   |
| POST   | Body: module_id, data (fields) | Create a record   |
| PATCH  | Body: module_id, record_id, data | Update a record |
| DELETE | Query: module_id, record_id | Delete a record        |

**Example: List records**

```http
GET /functions/v1/api-records?module_id=<module-uuid>
X-API-Key: your-api-key
```

**Example: Create a record**

```http
POST /functions/v1/api-records
X-API-Key: your-api-key
Content-Type: application/json

{
  "module_id": "<module-uuid>",
  "data": {
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "status": "Lead"
  }
}
```

**Example: Update a record**

```http
PATCH /functions/v1/api-records
X-API-Key: your-api-key
Content-Type: application/json

{
  "module_id": "<module-uuid>",
  "record_id": "<record-uuid>",
  "data": {
    "status": "Qualified"
  }
}
```

## Responses

- **200** — Success; body contains the record(s) or updated record.
- **201** — Created; body contains the new record.
- **400** — Bad request (e.g. missing module_id or invalid body).
- **401** — Unauthorized (missing or invalid API key).
- **403** — Forbidden (no permission for this resource).
- **404** — Module or record not found.

## Best Practices

- Store the API key in environment variables or a secrets manager.
- Use PATCH for partial updates; send only the fields you want to change.
- Respect rate limits if documented by your deployment.
- Use the correct `module_id` (UUID) for the module you are querying; get module IDs from the Modules page or a previous API response.

For more on creating and managing API keys, see **Settings → API** in the documentation.
