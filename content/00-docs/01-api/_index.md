---
title: "API Reference"
date: 2024-01-01
draft: false
weight: 2
---

# API Reference

Complete API documentation for developers.

## Authentication

All API requests require authentication using an API key.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.example.com/v1/endpoint
```

## Endpoints

### GET /api/v1/users

Retrieve a list of users.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Results per page (default: 20) |
| sort | string | Sort field (default: created_at) |

**Example Request:**

```bash
curl -X GET "https://api.example.com/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### POST /api/v1/users

Create a new user.

**Request Body:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin"
}
```

**Response:**

```json
{
  "id": "124",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin",
  "created_at": "2024-01-02T00:00:00Z"
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

**Error Response Format:**

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request parameters are invalid",
    "details": ["email is required"]
  }
}
```

## Rate Limiting

API requests are limited to 1000 requests per hour per API key.
