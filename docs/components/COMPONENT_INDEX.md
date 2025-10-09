# Component Documentation Index

**Complete library of reusable UI components, patterns, and design system guidelines.**

[← Back to Documentation Hub](../README.md) | [Systems Overview](../SYSTEMS_OVERVIEW.md)

## Component Categories

### Filter Components
Located in `/components/filters/`

#### [FilterBar](./filter-bar.md)
Main filtering interface with search, advanced filters, sorting, and presets.

#### [FilterForm](./filter-form.md) 
Advanced filter creation form with dynamic field generation.

#### [Pagination](./pagination.md)
Pagination controls with configurable page sizes and navigation.

### UI Components
Located in `/components/ui/` (shadcn/ui based)

Standard UI components following the shadcn/ui design system:
- Buttons, inputs, cards, dialogs, etc.
- Consistent styling and behavior
- Accessible by default

### App Components  
Located in `/app/components/`

App-specific components:
- Audio players
- File galleries
- YouTube players
- Marching formations

## Component Standards

### Props Interface
All components should have well-defined TypeScript interfaces:

```typescript
interface ComponentProps {
  // Required props
  requiredProp: string;
  
  // Optional props with defaults
  optionalProp?: boolean;
  
  // Event handlers
  onAction?: (value: string) => void;
  
  // Style customization
  className?: string;
  
  // Children for composition
  children?: React.ReactNode;
}
```

### Documentation Template
Each component should be documented with:

```markdown
# ComponentName

## Overview
Brief description of what the component does.

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Required prop description |
| prop2 | boolean | false | Optional prop description |

## Usage Examples

### Basic Usage
```tsx
<ComponentName prop1="value" />
```

### Advanced Usage
```tsx
<ComponentName 
  prop1="value"
  prop2={true}
  onAction={(value) => console.log(value)}
>
  <ChildComponent />
</ComponentName>
```

## Styling
- Available CSS classes
- Customization options
- Theme variables

## Accessibility
- ARIA attributes
- Keyboard navigation
- Screen reader support
```

## Design System

### Colors
- Primary: Bright blue
- Secondary: Warm orange  
- Success: Green
- Warning: Yellow
- Error: Red

### Typography
- Primary font: Inter
- Display font: Playfair Display
- Code font: JetBrains Mono

### Spacing
Following Tailwind's spacing scale (4px base unit).

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## Import Pattern

**Always use the component index for imports:**

```tsx
// ✅ Correct - Use component index
import { Button, Card, ShowCard, InquiryForm } from '@/components'

// ❌ Avoid - Direct imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

This provides:
- Single import location
- Better tree-shaking
- Easier refactoring
- Consistent patterns

---

## Related Documentation

- **[Developer Onboarding](../DEVELOPER_ONBOARDING.md)** - Component patterns and best practices
- **[Systems Overview](../SYSTEMS_OVERVIEW.md)** - UI framework and design system details
- **[Getting Started](../GETTING_STARTED.md)** - Set up your environment for development
- **[Theme System](../features/theme-system.md)** - Dark/light mode theming

---

**Last Updated**: October 2025  
**Questions?** Check [Documentation Hub](../README.md) for more resources