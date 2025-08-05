# 🗂️ Project Reorganization Plan

## Current Issues Identified

### 1. **Scattered Configuration Files**
- Multiple config files at root level
- No clear grouping by purpose

### 2. **Mixed Component Locations**
- Components in both `/app/components/` and `/components/`
- UI components mixed with business logic components

### 3. **Inconsistent Utility Organization**
- Utils split between `/lib/` and `/utils/`
- No clear separation of concerns

### 4. **Legacy Files Present**
- `jekyll-legacy/` directory still present
- Old configuration files mixed with new ones

### 5. **Documentation Scattered**
- Some docs in `/docs/`, some standalone files in root

## 📋 Reorganization Strategy

### Phase 1: Core Structure Cleanup

#### A. **Configuration Files** → `/config/`
```
config/
├── database.config.ts      # drizzle.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── eslint.config.js        # .eslintrc.json
└── typescript.config.ts    # tsconfig.json
```

#### B. **Component Consolidation** → `/components/`
```
components/
├── ui/                     # shadcn/ui components
├── forms/                  # form-specific components
├── layout/                 # layout components (nav, footer)
├── features/               # business logic components
│   ├── seo/
│   ├── filters/
│   └── marching-formation/
└── shared/                 # reusable components
```

#### C. **Library Consolidation** → `/lib/`
```
lib/
├── auth/
├── database/               # db/ → database/
├── email/
├── seo/
├── filters/
├── storage/
├── utils/                  # consolidated utilities
└── types/                  # shared TypeScript types
```

#### D. **Application Structure** → `/app/`
```
app/
├── (auth)/                 # auth group
│   ├── login/
│   └── auth/
├── (admin)/                # admin group
│   └── admin/
├── (public)/               # public pages group
│   ├── about/
│   ├── contact/
│   ├── arrangements/
│   ├── shows/
│   ├── faqs/
│   ├── guide/
│   └── process/
├── api/
├── globals.css
├── layout.tsx
└── page.tsx
```

### Phase 2: File Movement Plan

#### 1. **Move Configuration Files**
- Create `/config/` directory
- Move and rename config files
- Update import paths

#### 2. **Consolidate Components**
- Move `/app/components/` → `/components/features/`
- Organize by feature domain
- Update all import paths

#### 3. **Merge Utilities**
- Move `/utils/` contents → `/lib/utils/`
- Consolidate similar utilities
- Update import paths

#### 4. **Clean Up Legacy**
- Archive or remove `/jekyll-legacy/`
- Remove unused configuration files
- Clean up root directory

#### 5. **Organize Documentation**
- Move standalone docs to `/docs/`
- Create clear documentation structure
- Add README files for each major directory

### Phase 3: Path Alias Updates

Update `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/config/*": ["./config/*"],
      "@/types/*": ["./lib/types/*"]
    }
  }
}
```

## 🎯 Expected Benefits

1. **Better Developer Experience**
   - Clearer file locations
   - Consistent import patterns
   - Easier navigation

2. **Improved Maintainability**
   - Logical grouping by domain
   - Reduced coupling
   - Clear separation of concerns

3. **Enhanced Scalability**
   - Feature-based organization
   - Easier to add new features
   - Better code reusability

4. **Cleaner Repository**
   - Remove legacy files
   - Organized configuration
   - Professional structure

## 🚀 Implementation Order

1. **Create new directory structure**
2. **Move configuration files**
3. **Consolidate components**
4. **Merge utilities**
5. **Update all import paths**
6. **Clean up legacy files**
7. **Update documentation**
8. **Test and verify**

Would you like me to proceed with this reorganization?