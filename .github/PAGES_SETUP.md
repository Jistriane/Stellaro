# GitHub Pages Setup Guide

## ✅ Current Status

GitHub Pages is enabled and deploying via GitHub Actions.

- Official site: [stellaro.com.br](https://www.stellaro.com.br/)
- **Site URL**: [https://jistriane.github.io/Stellaro/](https://jistriane.github.io/Stellaro/)
- **Deployment mode**: GitHub Actions artifact upload + `actions/deploy-pages`
- **Manual trigger**: `workflow_dispatch`

## ✅ Quick Setup (3 steps)

### Step 1: Verify GitHub Pages Settings

1. Go to: [GitHub Pages settings](https://github.com/Jistriane/Stellaro/settings/pages)
2. Under **Build and deployment** section:
   - **Source**: Select `GitHub Actions` (not "Deploy from a branch")
3. Click **Save**

### Step 2: Trigger a New Deployment (Optional)

The workflow auto-runs on push to `master` when frontend-related files change. To deploy immediately:

```bash
# Option A: Push any change to master
git commit --allow-empty -m "trigger: enable github pages"
git push origin master

# Option B: Manually trigger via CLI
gh workflow run github-pages-deploy.yml

# Option C: Manually trigger via UI
# Go to: Actions > Deploy to GitHub Pages > Run workflow
```

### Step 3: Verify Deployment

1. Go to: [GitHub Actions](https://github.com/Jistriane/Stellaro/actions)
2. Watch `Deploy to GitHub Pages` workflow run
3. Once complete, visit: [https://jistriane.github.io/Stellaro/](https://jistriane.github.io/Stellaro/)

---

## 🔧 Troubleshooting

### Still seeing 404?

**Check 1: Is Pages enabled?**

```bash
gh api repos/Jistriane/Stellaro/pages
# Should return configuration when authenticated
```

**Check 2: Did the workflow run successfully?**

```bash
gh run list --workflow=github-pages-deploy.yml -L 5
gh run view <run-id> --log
```

**Check 3: Was artifact uploaded?**

- Go to Actions > Deploy to GitHub Pages > Latest run
- Look for "Upload Pages artifact" step
- Should show: `Uploaded artifact 'github-pages'`

**Check 4: Is basePath correct?**

- If repo is NOT at user root, update `next.config.mjs`:

  ```javascript
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/Stellaro';
  ```

### Build failed with "out/ not found"?

The Next.js static export might have failed. Check:

1. Build logs in GitHub Actions
2. Test locally first:

   ```bash
   cd apps/frontend
   npm run build:pages
   ls out/  # Should exist
   ```

3. If `out/` is empty, check for Next.js errors in the build step

### Deployment stuck or slow?

GitHub Pages can take 30-60 seconds to publish after artifact upload. Wait a few minutes before checking.

---

## 📋 Workflow Status Check

```bash
# View all workflow runs
gh run list

# View specific workflow
gh workflow view github-pages-deploy.yml

# Check deployment environment
gh api repos/Jistriane/Stellaro/deployments
```

---

## 🚀 Current Behavior

Your GitHub Pages site:

- **Auto-deploy** on every push to master (frontend changes)
- **Auto-rebuild** static export with `DEPLOY_TARGET=github-pages`
- **Live at**: [https://jistriane.github.io/Stellaro/](https://jistriane.github.io/Stellaro/)
- **Update within**: 1-2 minutes after push

---

## 📚 Related Documentation

- [GitHub Pages Setup](DEPLOYMENT.md) - Full deployment guide
- [Workflow Config](workflows/github-pages-deploy.yml) - Deployment workflow
- [Next.js Config](../apps/frontend/next.config.mjs) - Static export settings
- [Frontend Build Script](../apps/frontend/package.json) - `build:pages` command
