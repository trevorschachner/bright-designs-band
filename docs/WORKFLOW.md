# Development Workflow

## Branch Strategy

We use a **dev → main** workflow to batch changes before production deployments.

### Branches

- **`main`** - Production branch (connects to production site with deployment limits)
- **`dev`** - Development branch (daily work happens here)
- **`release/*`** - Release branches (created when batching changes for production)

## Daily Workflow

### 1. Work on Dev Branch

```bash
# Make sure you're on dev branch
git checkout dev
git pull origin dev

# Make your changes, commit frequently
git add .
git commit -m "Description of changes"

# Push to dev regularly
git push origin dev
```

### 2. When Ready for Production Release

#### Option A: Manual Release (Recommended)

1. **Create a release branch from dev:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b release/v1.0.0  # Use semantic versioning
   ```

2. **Create a Pull Request:**
   - Push the release branch: `git push origin release/v1.0.0`
   - Go to GitHub and create a PR from `release/v1.0.0` → `main`
   - Add a description of all changes in this release
   - Review the changes

3. **Merge to Main:**
   - Once approved, merge the PR to `main`
   - This will trigger production deployment (if configured)
   - Tag the release: `git tag v1.0.0 && git push origin v1.0.0`

4. **Update Dev Branch:**
   ```bash
   git checkout dev
   git merge main  # Sync dev with main
   git push origin dev
   ```

#### Option B: Using GitHub Actions

1. Go to Actions → "Release to Production"
2. Click "Run workflow"
3. Enter version number (e.g., `v1.0.0`)
4. Add release description
5. Review the created PR and merge when ready

## Best Practices

### Commit Messages

Use clear, descriptive commit messages:
- ✅ `Add audio player to arrangement detail page`
- ✅ `Fix image aspect ratio on show listing page`
- ❌ `fix stuff`
- ❌ `updates`

### Batching Changes

Group related changes together in releases:
- ✅ All image fixes in one release
- ✅ All audio player improvements in one release
- ❌ One commit = one release (wastes deployment quota)

### Before Creating a Release

1. ✅ All changes tested locally
2. ✅ No console errors
3. ✅ Code reviewed (if working with team)
4. ✅ Commit messages are clear
5. ✅ Changes are logically grouped

## Quick Reference

```bash
# Start working
git checkout dev
git pull origin dev

# Make changes and commit
git add .
git commit -m "Your message"
git push origin dev

# Create release (when ready)
git checkout dev
git checkout -b release/v1.0.0
git push origin release/v1.0.0
# Then create PR on GitHub: release/v1.0.0 → main

# After release is merged
git checkout dev
git merge main
git push origin dev
```

## Current Status

- **Active Branch:** `dev` (for daily development)
- **Production Branch:** `main` (deploys to production)
- **Current Release:** None (create one when ready to deploy)

