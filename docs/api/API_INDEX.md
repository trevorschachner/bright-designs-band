# API Documentation Index

**Complete reference for all API endpoints, data models, and integration patterns.**

[← Back to Documentation Hub](../README.md) | [Systems Overview](../SYSTEMS_OVERVIEW.md)

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
The public GETs need no session. Admin writes are not API routes: they are
Server Actions in `lib/actions/` (see `lib/actions/README.md`). The write
routes that used to live here (show, arrangement, piece, tag, resource and
file create/update/delete, plus the upload-signing route) were removed in SP3.

## Available Endpoints

All of these are `GET` unless noted. `?admin=true` (shows, tags) and
`?all=true` (resources) return the uncached staff view to an admin session,
always with `Cache-Control: private, no-store`; anyone else gets the public
data on the same private response. The shows and resources staff views also
accept `q`, a title search (`ilike`) used by the admin tables. The public
variants ignore `q`.

### Shows
- `GET /api/shows` - List shows with filtering (`?admin=true&q=` for the admin table)
- `GET /api/shows/[id]` - Get specific show

### Arrangements
- `GET /api/arrangements` - List arrangements with filtering
- `GET /api/arrangements/[id]` - Get specific arrangement

### Tags
- `GET /api/tags` - List all tags
- `GET /api/tags/[id]` - Get one tag

### Resources
- `GET /api/resources` - Active resources (`?all=true&q=` for staff: drafts too)
- `GET /api/resources/[id]` - One resource by id or slug

### Files
- `GET /api/files` - List files by `showId` / `arrangementId` / `fileType` (private rows for staff only)
- `GET /api/files/[id]` - One file's metadata (a private file is staff-only; others get 404)
- `GET /api/files/[id]/download` - Staff only: 302 to a 60 s signed URL (the `url` of every private-bucket file)

### Contact and export
- `POST /api/contact` - Contact form (Turnstile, rate-limited, stored in `contact_submissions`)
- `GET /api/export/[file]` - CSVs for the Show Database sheet (`shows.csv`, `parts.csv`, `pieces.csv`, `links.csv`)

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