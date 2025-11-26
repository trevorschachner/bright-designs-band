# Database Migration Safety Guidelines

## Critical Rules for Migrations

### ❌ NEVER USE These Commands in Migrations

These commands are **destructive** and will delete data:

```sql
-- NEVER DROP TABLES (deletes all data in the table)
DROP TABLE table_name;

-- NEVER TRUNCATE (deletes all rows in the table)
TRUNCATE TABLE table_name;

-- NEVER DELETE without extreme caution (deletes specific rows)
DELETE FROM table_name WHERE condition;

-- NEVER DROP COLUMNS without backup (loses data permanently)
ALTER TABLE table_name DROP COLUMN column_name;

-- NEVER DROP DATABASE (deletes everything)
DROP DATABASE database_name;
```

### ✅ Safe Migration Commands

These commands are generally safe and do not delete data:

```sql
-- Safe: Creates new tables
CREATE TABLE IF NOT EXISTS table_name (...);

-- Safe: Adds new columns (doesn't remove existing data)
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name type;

-- Safe: Modifies column types (with caution - test first!)
ALTER TABLE table_name ALTER COLUMN column_name TYPE new_type;

-- Safe: Creates or replaces policies (security rules)
DROP POLICY IF EXISTS policy_name ON table_name;
CREATE POLICY policy_name ON table_name ...;

-- Safe: Creates indexes (improves performance)
CREATE INDEX IF NOT EXISTS index_name ON table_name (column);

-- Safe: Adds constraints
ALTER TABLE table_name ADD CONSTRAINT constraint_name ...;
```

## Migration Workflow

### Before Running Any Migration

1. **Review the SQL carefully** - Read every line to ensure no destructive commands
2. **Test in a development branch** - Use Supabase branching if available
3. **Backup critical data** - Export important tables before major changes
4. **Document what changes** - Add comments explaining each command

### Safe Migration Example

```sql
-- Add a new column to shows table (safe - doesn't delete data)
ALTER TABLE shows 
ADD COLUMN IF NOT EXISTS commissioned_by TEXT;

-- Update existing rows with default value (safe - modifies, doesn't delete)
UPDATE shows 
SET commissioned_by = 'Unknown' 
WHERE commissioned_by IS NULL;

-- Add RLS policy (safe - only affects permissions)
CREATE POLICY "Allow public read" ON shows
FOR SELECT TO public USING (true);
```

### Unsafe Migration Example (AVOID!)

```sql
-- ❌ DANGEROUS: Drops entire table and all data
DROP TABLE shows;

-- ❌ DANGEROUS: Deletes all rows
TRUNCATE TABLE shows;

-- ❌ DANGEROUS: Removes column and all its data
ALTER TABLE shows DROP COLUMN title;

-- ❌ DANGEROUS: Deletes specific data
DELETE FROM shows WHERE year < 2020;
```

## Renaming or Restructuring Data Safely

If you need to rename columns or restructure data:

```sql
-- Step 1: Add new column
ALTER TABLE shows ADD COLUMN new_name TEXT;

-- Step 2: Copy data from old to new
UPDATE shows SET new_name = old_name;

-- Step 3: Verify data copied correctly
SELECT COUNT(*) FROM shows WHERE new_name IS NULL;

-- Step 4: Only after verification, drop old column
-- (But consider keeping it for rollback safety!)
-- ALTER TABLE shows DROP COLUMN old_name;
```

## Emergency Rollback Plan

If a migration goes wrong:

1. **Check Supabase Backups** - Supabase maintains automatic backups
2. **Use Point-in-Time Recovery** - Restore to before the migration
3. **Contact support** - Get help from Supabase support if needed

## Migration Review Checklist

Before applying any migration, verify:

- [ ] No `DROP TABLE` commands
- [ ] No `TRUNCATE TABLE` commands  
- [ ] No `DELETE FROM` commands (or verified safe with WHERE clause)
- [ ] No `DROP COLUMN` commands (or data backed up)
- [ ] All changes are additive (adding, not removing)
- [ ] Comments explain what each command does
- [ ] Tested in development environment first
- [ ] Data backup created if making risky changes

## Types of Safe Migrations

### 1. Adding Security Policies (Always Safe)

```sql
CREATE POLICY "policy_name" ON table_name
FOR SELECT TO public USING (true);
```

### 2. Adding New Columns (Always Safe)

```sql
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS new_column type DEFAULT value;
```

### 3. Creating New Tables (Always Safe)

```sql
CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  ...
);
```

### 4. Adding Indexes (Always Safe)

```sql
CREATE INDEX IF NOT EXISTS idx_name 
ON table_name (column);
```

### 5. Updating Values (Verify WHERE clause!)

```sql
-- Safe if WHERE clause is correct
UPDATE table_name 
SET column = value 
WHERE safe_condition;
```

## Summary

**Golden Rule**: When in doubt, DON'T DROP OR DELETE. It's better to add new columns/tables and deprecate old ones than to risk losing data.

Always prioritize data safety over code cleanliness. Old, unused columns are harmless; lost data is catastrophic.

