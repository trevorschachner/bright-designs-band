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

#### 2. **Schema Analyzer** (`lib/filters/schema-analyzer.ts`)
Automatically generates filterable fields from database schema:
- `SchemaAnalyzer.generateFilterFields()` - Creates filter fields from table definitions
- Pre-configured schemas for Shows and Arrangements
- Dynamic operator assignment based on field types

#### 3. **Query Builder** (`lib/filters/query-builder.ts`)
Converts filter conditions to database queries:
- `QueryBuilder.buildWhereClause()` - Generates WHERE conditions
- `QueryBuilder.buildOrderByClause()` - Generates ORDER BY clauses
- `FilterUrlManager` - URL parameter serialization/deserialization

#### 4. **Filter Presets** (`lib/filters/presets.ts`)
Pre-defined filter combinations for common use cases:
- Shows: Recent, Beginner Friendly, Advanced, Budget Friendly
- Arrangements: Orchestral, Marching Band, Budget, Premium

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

#### **useFilterState** (`hooks/use-filter-state.ts`)
Manages filter state with URL synchronization:
- Automatic URL parameter updates
- Browser history support
- Debounced state changes

## Usage Examples

### Basic Implementation

```tsx
import { FilterBar, Pagination } from '@/components/filters';
import { useFilterState } from '@/hooks/use-filter-state';
import { SHOWS_FILTER_FIELDS, SHOWS_PRESETS } from '@/lib/filters';

export default function ShowsPage() {
  const { filterState, setFilterState } = useFilterState();
  
  return (
    <div>
      <FilterBar
        filterState={filterState}
        onFilterStateChange={setFilterState}
        filterFields={SHOWS_FILTER_FIELDS}
        presets={SHOWS_PRESETS}
      />
      
      {/* Your data display */}
      
      <Pagination
        pagination={response.pagination}
        onPageChange={(page) => setFilterState({ ...filterState, page })}
        onLimitChange={(limit) => setFilterState({ ...filterState, limit, page: 1 })}
      />
    </div>
  );
}
```

### API Integration

```tsx
// Enhanced API route with filtering support
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterState = FilterUrlManager.fromUrlParams(searchParams);
  
  let query = db.select().from(shows);
  
  // Add search conditions
  if (filterState.search) {
    const searchCondition = QueryBuilder.buildSearchCondition(
      shows, filterState.search, ['title', 'description']
    );
    if (searchCondition) query = query.where(searchCondition);
  }
  
  // Add filter conditions
  if (filterState.conditions.length > 0) {
    const whereClause = QueryBuilder.buildWhereClause(shows, filterState.conditions);
    if (whereClause) query = query.where(whereClause);
  }
  
  // Add sorting
  if (filterState.sort.length > 0) {
    const orderBy = QueryBuilder.buildOrderByClause(shows, filterState.sort);
    query = query.orderBy(...orderBy);
  }
  
  // Add pagination
  query = query.limit(filterState.limit || 20)
               .offset(((filterState.page || 1) - 1) * (filterState.limit || 20));
  
  const data = await query;
  const total = await db.select({ count: count() }).from(shows);
  
  return NextResponse.json(QueryBuilder.buildFilteredResponse(data, total, filterState));
}
```

## Extending the System

### Adding New Filter Fields

When you add a new column to your database:

1. **Update the schema definition** in `lib/filters/schema-analyzer.ts`:
```tsx
export const SHOWS_SCHEMA: TableSchema = {
  // ... existing fields
  fields: {
    // ... existing fields
    newField: { key: 'newField', type: 'text' }, // Add your new field
  }
};
```

2. **The filter system automatically detects and supports the new field!**

### Adding Custom Operators

1. **Define the operator** in `lib/filters/types.ts`:
```tsx
export type FilterOperator = 
  | 'equals'
  | 'contains'
  // ... existing operators
  | 'myCustomOperator'; // Add your operator
```

2. **Implement the logic** in `QueryBuilder.buildCondition()`:
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
2. **URL not updating**: Ensure `syncWithUrl` is enabled in `useFilterState`
3. **Performance issues**: Consider adding database indexes for frequently filtered fields
4. **Type errors**: Verify that filter field types match database column types

### Debug Mode

Enable detailed logging by setting:
```tsx
const { filterState } = useFilterState({ debugMode: true });
```

This system provides a robust, scalable solution for filtering and sorting that grows with your application!