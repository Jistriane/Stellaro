#!/usr/bin/env bash
set -euo pipefail

# GitHub Pages Setup & Verification Script
# Checks and enables GitHub Pages in repository settings

REPO="${1:-$(gh repo view --json nameWithOwner -q)}"
PAGES_URL="https://github.com/$REPO/settings/pages"

echo "🔍 GitHub Pages Setup for: $REPO"
echo ""

# Check if Pages is already configured
echo "📋 Checking current Pages configuration..."
PAGES_CONFIG=$(gh api "repos/$REPO/pages" 2>/dev/null || echo "{}")

if echo "$PAGES_CONFIG" | grep -q '"source":{"branch":"gh-pages"'; then
    echo "✅ GitHub Pages is already enabled (branch source)"
    echo "   URL: $(echo "$PAGES_CONFIG" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4)"
elif echo "$PAGES_CONFIG" | grep -q '"build_type":"workflow"'; then
    echo "✅ GitHub Pages is already enabled (GitHub Actions source)"
    PAGES_URL=$(echo "$PAGES_CONFIG" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4 || echo "https://jistriane.github.io/Stellaro/")
    echo "   URL: $PAGES_URL"
    echo ""
    echo "🚀 Triggering workflow to deploy..."
    gh workflow run github-pages-deploy.yml
    echo "✅ Workflow triggered! Check progress at: https://github.com/$REPO/actions"
else
    echo "❌ GitHub Pages not enabled"
    echo ""
    echo "📖 To enable GitHub Pages:"
    echo ""
    echo "  1. Open: $PAGES_URL"
    echo "  2. Under 'Build and deployment':"
    echo "     - Source: GitHub Actions"
    echo "  3. Click 'Save'"
    echo ""
    echo "💡 Then run:"
    echo "   git commit --allow-empty -m 'trigger: enable github pages'"
    echo "   git push origin master  # or main"
    echo ""
    echo "Or immediately trigger workflow:"
    echo "   gh workflow run github-pages-deploy.yml"
fi

echo ""
echo "📊 Recent workflow runs:"
gh run list --workflow=github-pages-deploy.yml -L 3 --json status,conclusion,createdAt,headBranch --template '{{range .}}{{.status}} ({{.conclusion}}) - {{.createdAt}} [{{.headBranch}}]{{"\n"}}{{end}}'
