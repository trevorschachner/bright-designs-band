# API Documentation Index

**Complete reference for all API endpoints, data models, and integration patterns.**

[← Back to Documentation Hub](../README.md) | [Systems Overview](../SYSTEMS_OVERVIEW.md)

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
Most endpoints require authentication via Supabase session tokens.

## Available Endpoints

### Shows
- `GET /api/shows` - List shows with filtering
- `GET /api/shows/[id]` - Get specific show
- `POST /api/shows` - Create new show (auth required)
- `PUT /api/shows/[id]` - Update show (auth required)

### Arrangements  
- `GET /api/arrangements` - List arrangements with filtering
- `GET /api/arrangements/[id]` - Get specific arrangement
- `POST /api/arrangements` - Create new arrangement (auth required)
- `PUT /api/arrangements/[id]` - Update arrangement (auth required)

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag (auth required)
- `PUT /api/tags/[id]` - Update tag (auth required)
- `DELETE /api/tags/[id]` - Delete tag (auth required)

### Files
- `GET /api/files` - List files with filtering
- `POST /api/files` - Upload new file (auth required)
- `DELETE /api/files/[id]` - Delete file (auth required)

## Filtering & Pagination

Many endpoints support advanced filtering via query parameters:

```
GET /api/shows?search=symphony&page=1&limit=20&filters=[{"field":"difficulty","operator":"equals","value":"Advanced"}]&sort=[{"field":"createdAt","direction":"desc"}]
```

### Query Parameters
- `search` - Global text search
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `filters` - JSON array of filter conditions
- `sort` - JSON array of sort conditions

### Filter Conditions
```typescript
{
  field: string,      // Field name to filter on
  operator: string,   // Operator (equals, contains, gt, lt, etc.)
  value: any,         // Filter value
  values?: any[]      // Multiple values for 'in' operator
}
```

### Sort Conditions
```typescript
{
  field: string,      // Field name to sort by
  direction: 'asc' | 'desc'
}
```

## Response Format

### Success Response
```typescript
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  },
  appliedFilters: FilterState
}
```

### Error Response
```typescript
{
  error: string,
  details?: any
}
```

## Rate Limiting
- **Anonymous**: 100 requests per hour
- **Authenticated**: 1000 requests per hour

---

## Related Documentation

- **[Getting Started](../GETTING_STARTED.md)** - Set up your environment to use the API
- **[Systems Overview](../SYSTEMS_OVERVIEW.md)** - Understand the technology stack
- **[Feature Documentation](../features/FEATURE_INDEX.md)** - How features use these APIs
- **[Database Schema](../setup/database-security.md)** - Database structure and security

---

**Last Updated**: October 2025  
**Questions?** Check [Documentation Hub](../README.md) for more resources