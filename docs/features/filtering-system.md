# Dynamic Filtering and Sorting System

This document describes the comprehensive filtering and sorting system implemented for the Bright Designs Band application.

## Overview

The filtering system provides dynamic, database-driven filtering and sorting capabilities for both Shows and Arrangements. The system automatically adapts when new properties are added to the database schema.

## Features

### 🔍 **Dynamic Schema Detection**
- Automatically generates filter fields from database schema
- Supports all major data types: text, number, date, boolean, enum, relations
- Easy to extend when adding new database columns

### 🎯 **Comprehensive Filtering**
- **Text Search**: Global search across multiple fields
- **Advanced Filters**: Field-specific filtering with multiple operators
- **Range Filters**: For numeric and date fields
- **Enum Selection**: Dropdown selection for predefined values
- **Relation Filtering**: Filter by related entity properties

### 📊 **Multi-Column Sorting**
- Sort by any filterable field
- Ascending/descending direction control
- Default sorting with fallbacks

### 🔗 **URL State Management**
- Filter state persisted in URL parameters
- Shareable filtered views
- Browser back/forward support
- Bookmarkable results

### ⚡ **Performance Optimized**
- Server-side filtering and pagination
- Efficient database queries with Drizzle ORM
- Debounced search inputs
- Parallel data fetching

### 🎨 **Responsive UI**
- Clean, intuitive filter interface
- Mobile-friendly design
- Real-time filter updates
- Loading states and error handling

## Architecture

### Core Components

#### 1. **Filter Types** (`lib/filters/types.ts`)
Defines TypeScript interfaces for the entire filtering system:
- `FilterState` - Complete filter state
- `FilterCondition` - Individual filter conditions
- `SortCondition` - Sorting configuration
- `FilterField` - Field metadata for UI generation
- `FilteredResponse` - API response format

#### 2. **Field derivation** (`lib/filters/filter-fields.ts`)
Builds `FilterField[]` from a Drizzle table plus an explicit allowlist:
- `deriveFilterFields(table, spec)` - the only way filter fields are made
- Field type, operators and enum members are read off the Drizzle column
- Allowlist keys are typed as the table's own columns, so naming a column that
  does not exist is a compile error

Field type is derived from Drizzle's `columnType`, **not** `dataType`. Numeric
columns report `dataType: 'string'` because Drizzle carries them as strings to
avoid float precision loss, so keying off `dataType` would silently turn `price`
into a text filter and strip its range operators.

#### 3. **Field definitions** (`lib/filters/filter-definitions.ts`)
The allowlist itself — which columns users may filter on, in what order, and how
each is described. `SHOWS_FILTER_FIELDS` and `ARRANGEMENTS_FILTER_FIELDS` are
the only exports pages consume.

#### 4. **Query building** (`lib/filters/table-query.ts`, `lib/filters/query-builder.ts`)
- `buildTableQuery(table, options)` - what API routes call. Absorbs the where
  clause, search, relation handling and ordering, and throws
  `UnknownFilterFieldError` for a field the table does not have.
- `QueryBuilder` - lower-level pieces. Routes still use
  `QueryBuilder.buildFilteredResponse()` to shape the response envelope, and
  `FilterUrlManager` for URL parameter serialization.

#### 5. **Filter Presets** (`lib/filters/presets.ts`)
`SHOWS_PRESETS` and `ARRANGEMENTS_PRESETS` are both **empty**. Nothing rendered
them, and all four original arrangement presets filtered on `type` and `price`,
neither of which is a column on `arrangements`, so applying one would have
thrown. Rebuild from the `*_FILTER_FIELDS` lists if presets are wanted.

### UI Components

#### 1. **FilterBar** (`components/filters/filter-bar.tsx`)
Main filter interface component:
- Search input with real-time updates
- Advanced filter sheet
- Sort dropdown
- Filter presets
- Active filter display

#### 2. **FilterForm** (`components/filters/filter-form.tsx`)
Advanced filter creation interface:
- Dynamic form generation based on field types
- Multiple operator support
- Validation and error handling

#### 3. **Pagination** (`components/filters/pagination.tsx`)
Pagination controls with configurable page sizes:
- Page navigation
- Items per page selection
- Results summary

### Custom Hooks

#### **useCatalogUrlState** (`lib/hooks/use-catalog-url-state.ts`)
The URL is the filter state. The hook mirrors it locally so inputs respond at
once, debounces writes back to the URL (`router.replace`), and resyncs on
back/forward. `FilterBar` and `FilterSidebar` call it themselves.

## Usage Examples

### Basic Implementation

The catalog pages are server components: they parse `searchParams`, query
through the service layer, and render `FilterSidebar` (a client component
that reads and writes the URL itself) next to the server-rendered results.
See `app/shows/page.tsx`.

### API Integration

Routes hand the whole filter state to `buildTableQuery` rather than assembling
conditions themselves. The two routes used to do that assembly independently and
had diverged; `shows` threw on any relation filter while `arrangements` handled
it, and the shows `catch` turned the failure into an empty `200`, making a broken
filter indistinguishable from a genuine no-match.

```tsx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterState = FilterUrlManager.fromUrlParams(searchParams);
  const page = filterState.page || 1;
  const limit = filterState.limit || 20;

  try {
    const { where, orderBy } = buildTableQuery(shows, {
      search: filterState.search,
      searchable: ['title', 'description'],
      conditions: filterState.conditions,
      sort: filterState.sort,
      relations: { tags: tagsSubquery },
    });

    // ... run the count and rows queries with `where` and `orderBy`

    return SuccessResponse(
      QueryBuilder.buildFilteredResponse(data, total, { ...filterState, limit })
    );
  } catch (error) {
    // A filter naming a column the table does not have is the caller's mistake
    // and must surface as a 400, not an empty 200.
    if (error instanceof UnknownFilterFieldError) {
      return BadRequestResponse(`Unknown filter field: ${error.field}`);
    }
    throw error;
  }
}
```

## Extending the System

### Adding New Filter Fields

Adding a column to the database does **not** make it filterable, and that is
deliberate. "Which columns exist" is Drizzle's to answer; "which columns a user
may filter on" is a product decision nothing can infer.

Add an entry to the allowlist in `lib/filters/filter-definitions.ts`:

```tsx
export const SHOWS_FILTER_FIELDS: FilterField[] = deriveFilterFields(shows, {
  columns: [
    // ... existing entries
    {
      key: 'newField',                        // must be a real column, or it will not compile
      description: 'What this field means',   // shown in the UI
      placeholder: 'Filter by new field...',  // optional; defaults from the key
    },
  ],
  relations: [ /* ... */ ],
});
```

Type, operators and enum members are derived from the Drizzle column. You only
supply intent: order, label, description, and any `min`/`max` bounds.

> **Do not reintroduce a hand-written field list.** `type`, `price` and `showId`
> sat in the old `ARRANGEMENTS_SCHEMA` for nine months after those columns
> stopped existing. Every one was a filter the UI offered and the server
> answered with a 500. The allowlist is typed against the table specifically so
> that cannot happen again.

**Relation fields are the exception.** They name no column, so the type system
cannot check them, and they only work if the route passes `buildTableQuery` a
handler for the key. `tags` is currently the only relation either route
resolves; adding another without a handler produces a 400 at query time. There
is a test pinning this.

### Adding Custom Operators

1. **Define the operator** in `lib/filters/types.ts`:
```tsx
export type FilterOperator = 
  | 'equals'
  | 'contains'
  // ... existing operators
  | 'myCustomOperator'; // Add your operator
```

2. **Implement the logic** in `QueryBuilder.buildCondition()` (`lib/filters/query-builder.ts`):
```tsx
case 'myCustomOperator':
  return myCustomCondition(column, value);
```

### Creating Custom Presets

```tsx
export const MY_CUSTOM_PRESETS: FilterPreset[] = [
  {
    id: 'my-preset',
    name: 'My Custom Filter',
    description: 'Description of what this filter does',
    filters: {
      conditions: [
        { field: 'title', operator: 'contains', value: 'special' }
      ],
      sort: [
        { field: 'createdAt', direction: 'desc' }
      ]
    }
  }
];
```

## Performance Considerations

- **Server-side filtering**: All filtering happens at the database level
- **Efficient queries**: Uses Drizzle ORM's optimized query building
- **Pagination**: Limits data transfer and improves load times
- **Debounced inputs**: Prevents excessive API calls during typing
- **URL state**: Enables caching and direct linking

## Browser Support

- Modern browsers with URLSearchParams support
- Graceful degradation for older browsers
- Progressive enhancement approach

## Future Enhancements

1. **Saved Filters**: Allow users to save custom filter combinations
2. **Export Functionality**: Export filtered results to CSV/PDF
3. **Advanced Analytics**: Filter usage tracking and optimization
4. **Real-time Updates**: WebSocket integration for live data updates
5. **Bulk Operations**: Actions on filtered result sets

## Troubleshooting

### Common Issues

1. **Filters not working**: Check that the field exists in both schema definition and database
2. **URL not updating**: The filter components must render inside a `<Suspense>` boundary (they read `useSearchParams`)
3. **Performance issues**: Consider adding database indexes for frequently filtered fields
4. **Type errors**: Verify that filter field types match database column types

This system provides a robust, scalable solution for filtering and sorting that grows with your application!