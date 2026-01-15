#!/bin/bash
# Quick Fix Script - Amend and Force Push with Lease
# Usage: ./fix.sh [commit message]
# If no message provided, uses the previous commit message

set -e

# Get the commit message
if [ -z "$1" ]; then
  # Use the previous commit message
  COMMIT_MSG=$(git log -1 --pretty=%B)
  echo "📝 Using previous commit message:"
  echo "   $COMMIT_MSG"
else
  COMMIT_MSG="$1"
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  No changes to commit. Working directory is clean."
  exit 1
fi

# Show what will be committed
echo "📋 Changes to be committed:"
git status --short

# Confirm
read -p "Continue with amend and force push? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 1
fi

# Stage all changes
echo "📦 Staging all changes..."
git add -A

# Amend the last commit
echo "✏️  Amending last commit..."
git commit --amend -m "$COMMIT_MSG" --no-edit

# Get current branch
BRANCH=$(git branch --show-current)

# Force push with lease (safer - fails if remote has new commits)
echo "🚀 Force pushing to $BRANCH (with lease)..."
git push --force-with-lease origin "$BRANCH"

echo ""
echo "✅ Done! Commit amended and pushed to $BRANCH"
