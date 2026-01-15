#!/bin/bash
# Quick Fix Script - Amend and Force Push (No Confirmation)
# Usage: ./fix-quick.sh [commit message]
# WARNING: This skips confirmation - use with caution!

set -e

# Get the commit message
if [ -z "$1" ]; then
  # Use the previous commit message
  COMMIT_MSG=$(git log -1 --pretty=%B)
else
  COMMIT_MSG="$1"
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  No changes to commit. Working directory is clean."
  exit 1
fi

# Stage all changes
git add -A

# Amend the last commit
git commit --amend -m "$COMMIT_MSG" --no-edit

# Get current branch
BRANCH=$(git branch --show-current)

# Force push with lease
git push --force-with-lease origin "$BRANCH"

echo "✅ Fixed and pushed to $BRANCH"
