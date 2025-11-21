#!/bin/bash

# Script to create a release branch from dev
# Usage: ./scripts/create-release.sh v1.0.0 "Description of release"

set -e

VERSION=$1
DESCRIPTION=${2:-"Release $VERSION"}

if [ -z "$VERSION" ]; then
  echo "Error: Version is required"
  echo "Usage: ./scripts/create-release.sh v1.0.0 \"Description of release\""
  exit 1
fi

# Ensure we're on dev branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "dev" ]; then
  echo "Warning: You're not on the dev branch. Current branch: $CURRENT_BRANCH"
  read -p "Switch to dev branch? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout dev
    git pull origin dev
  else
    echo "Aborted."
    exit 1
  fi
fi

# Create release branch
RELEASE_BRANCH="release/$VERSION"
echo "Creating release branch: $RELEASE_BRANCH"
git checkout -b "$RELEASE_BRANCH"

# Push release branch
echo "Pushing release branch to origin..."
git push -u origin "$RELEASE_BRANCH"

echo ""
echo "✅ Release branch created: $RELEASE_BRANCH"
echo ""
echo "Next steps:"
echo "1. Go to GitHub: https://github.com/trevorschachner/bright-designs-band/compare/main...$RELEASE_BRANCH"
echo "2. Create a Pull Request from $RELEASE_BRANCH to main"
echo "3. Add description: $DESCRIPTION"
echo "4. Review and merge when ready for production"
echo ""
echo "After merging, run:"
echo "  git checkout dev"
echo "  git merge main"
echo "  git push origin dev"

