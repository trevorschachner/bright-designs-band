# Email Template Testing Guide

This guide explains how to test email templates to ensure they work correctly before deployment.

## Quick Start

Run all email template tests:
```bash
npm run test:email
```

Run email validation script:
```bash
npm run test:email:validate
```

## Test Scripts

### `npm run test:email`
Runs all Vitest unit tests for email templates. This checks:
- Template generation (HTML and text versions)
- Required fields are included
- Logo and branding elements
- Form field display (radio buttons, checkboxes)
- Edge cases (empty fields, special characters, etc.)

### `npm run test:email:validate`
Runs a comprehensive validation script that checks:
- Valid HTML structure
- Logo references
- Brand colors
- "What to Expect Next" section
- Email links
- No undefined/null values in output

### `npm run test`
Runs all tests in the project (including email tests)

### `npm run test:watch`
Runs tests in watch mode for development

### `npm run test:ci`
Runs tests with coverage reporting (for CI/CD)

## What Gets Tested

### Admin Notification Email (`generateContactEmailTemplate`)
- ✅ Generates valid HTML and text versions
- ✅ Includes logo and branding
- ✅ Displays all form fields correctly
- ✅ Shows radio button options for band size and ability level
- ✅ Shows checkbox options for services
- ✅ Includes "What to Expect Next" section
- ✅ Handles missing optional fields gracefully
- ✅ Valid HTML structure

### Customer Confirmation Email (`generateCustomerConfirmationTemplate`)
- ✅ Generates valid HTML and text versions
- ✅ Includes logo and branding
- ✅ Shows submission summary with all fields
- ✅ Includes "What to Expect Next" section
- ✅ Includes contact information in footer
- ✅ Valid HTML structure

### Edge Cases
- Empty message fields
- Very long messages
- Special characters in names
- Missing optional fields

## Running Tests Locally

### Before Committing Changes
Always run tests before committing email template changes:

```bash
# Run email tests
npm run test:email

# Run validation
npm run test:email:validate

# Run linter
npm run lint
```

### During Development
Use watch mode for continuous testing:

```bash
npm run test:watch
```

Then filter to email tests:
```
Press 'f' to filter by filename: email
```

## CI/CD Integration

Tests automatically run in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

The CI pipeline includes:
1. **Linter** - Checks code style
2. **Email Template Tests** - Unit tests for templates
3. **Email Validation** - HTML structure validation
4. **Build Check** - Ensures project builds successfully

## Writing New Tests

Tests are located in `lib/email/__tests__/templates.test.ts`.

Example test structure:

```typescript
describe('generateContactEmailTemplate', () => {
  it('should include required element', () => {
    const data: ContactFormData = {
      // ... test data
    };
    
    const result = generateContactEmailTemplate(data);
    
    expect(result.html).toContain('expected content');
  });
});
```

## Troubleshooting

### Tests Failing After Template Changes
1. Check that all required fields are still included
2. Verify logo URL is correct
3. Ensure "What to Expect Next" section exists
4. Check for undefined/null values in template output

### Validation Script Failing
The validation script checks for:
- Missing HTML structure tags
- Logo image references
- Brand colors
- Required sections

Fix issues in the template file and re-run tests.

### Environment Variables
Tests use `NEXT_PUBLIC_SITE_URL` for logo URLs. Set this in your `.env.local`:
```
NEXT_PUBLIC_SITE_URL=https://brightdesigns.band
```

Or set it when running tests:
```bash
NEXT_PUBLIC_SITE_URL=https://brightdesigns.band npm run test:email
```

## Best Practices

1. **Always test before committing** - Run `npm run test:email` before pushing changes
2. **Test edge cases** - Empty fields, long text, special characters
3. **Verify both templates** - Admin notification and customer confirmation
4. **Check HTML validity** - Use `npm run test:email:validate`
5. **Review CI results** - Check GitHub Actions after pushing

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) automatically:
- Runs tests on every push and PR
- Tests on multiple Node.js versions (18.x, 20.x)
- Validates email templates
- Checks build succeeds
- Uploads test results as artifacts

View test results in the GitHub Actions tab of your repository.

