# 🔐 GitHub Fine-Grained Token Setup Guide

This guide shows you how to create a secure, fine-grained personal access token for AutoDeploy Engine.

## Why Fine-Grained Tokens?

✅ **More secure** - Only access specific repositories
✅ **Granular permissions** - Only the permissions you need
✅ **Expiration dates** - Automatic security refresh
✅ **Activity logs** - See what the token is used for

---

## Step 1: Create the Token

### 1. Navigate to GitHub Settings

Visit: https://github.com/settings/personal-access-tokens/new

Or manually:
1. Click your profile picture (top right)
2. **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
3. Click **"Generate new token"**

---

### 2. Configure Basic Settings

**Token name:** `AutoDeploy Engine`

**Expiration:**
- **Recommended:** 90 days
- **Why:** Balance between security and convenience
- Set a calendar reminder to regenerate before expiration

**Description:** (Optional)
```
Used by AutoDeploy Engine CLI for automated CI/CD setup
```

---

### 3. Repository Access

Choose **one** of these options:

#### Option A: All Repositories (Not Recommended)
- ⚠️ Gives access to ALL your repos
- Only use if you deploy many projects

#### Option B: Selected Repositories (Recommended)
- ✅ Most secure option
- Select only the repositories you want to deploy
- You can add more repositories later

**How to select:**
1. Click **"Only select repositories"**
2. Click **"Select repositories"** dropdown
3. Search and select your project(s)

---

### 4. Permissions (CRITICAL)

**Repository permissions** - Set these exactly:

| Permission | Access Level | Why |
|------------|-------------|-----|
| **Contents** | Read and write | Create/update workflow files |
| **Metadata** | Read-only | Required (automatically set) |
| **Workflows** | Read and write | Create GitHub Actions workflows |
| **Secrets** | Read and write | Store signing keys, API tokens |
| **Actions** | Read and write | Trigger builds, view runs |
| **Administration** | Read-only | Check repo settings (optional) |

**Account permissions** - Leave all as "No access"

---

### 5. Generate and Copy

1. Click **"Generate token"** at the bottom
2. **IMMEDIATELY COPY THE TOKEN** - You'll only see it once!
3. Token format: `github_pat_11AAAAAA...` (starts with `github_pat_`)

⚠️ **NEVER share this token or commit it to git!**

---

## Step 2: Add Token to AutoDeploy

### Option A: Automated Setup (Recommended)

```bash
autodeploy github setup

# Follow the prompts:
# 1. Select "Create new token"
# 2. Browser opens to GitHub
# 3. Create token (steps above)
# 4. Paste token in terminal
# 5. Token is encrypted and saved locally
```

### Option B: Manual Entry

```bash
autodeploy github setup

# Select "Enter existing token"
# Paste your token
# Token is encrypted and saved
```

---

## Step 3: Verify Token

```bash
autodeploy github verify

# Output:
# ✓ Read repository
# ✓ Write workflows
# ✓ Create secrets
# ✓ Trigger actions
```

If any checks fail:
1. Go back to GitHub token settings
2. Add missing permissions
3. Re-run verification

---

## Token Storage

**Where is it stored?**
- `~/.autodeploy/tokens.enc` (encrypted)
- `~/.autodeploy/.key` (encryption key, never share!)

**Security:**
- ✅ AES-256-GCM encryption
- ✅ Unique key per machine
- ✅ File permissions: 0600 (read/write by owner only)
- ✅ Not in project directory (safe to commit)

---

## Using Your Token

Once set up, AutoDeploy automatically uses your token for:

### Automated Setup
```bash
autodeploy init --auto-setup

# What it does:
# 1. Generates config files
# 2. Pushes workflows to GitHub
# 3. Sets repository secrets
# 4. Triggers first build
```

### Manual Operations
```bash
# Trigger deployment
autodeploy deploy

# Check status
autodeploy status

# View workflow runs
autodeploy github runs

# Trigger specific workflow
autodeploy github trigger
```

---

## Token Permissions Explained

### Why Each Permission is Needed:

**Contents (Read & Write)**
- Create `.github/workflows/` directory
- Upload workflow YAML files
- Update README and config files
- Required for: All projects

**Workflows (Read & Write)**
- Create/modify GitHub Actions workflows
- Enable/disable workflows
- Required for: All projects

**Secrets (Read & Write)**
- Store environment variables securely
- Add API keys, signing certificates
- Required for: Android (signing keys), Backend (database URLs)

**Actions (Read & Write)**
- Trigger workflow runs manually
- Check workflow status
- Download build artifacts
- Required for: All projects

---

## Troubleshooting

### "Permission denied" errors

**Problem:** Token lacks required permissions

**Solution:**
1. Go to https://github.com/settings/tokens
2. Click on your "AutoDeploy Engine" token
3. Add missing permissions
4. Re-run `autodeploy github verify`

---

### "Resource not accessible" errors

**Problem:** Token doesn't have access to repository

**Solution:**
1. Go to token settings
2. Under "Repository access", add the repository
3. Save changes
4. Try again

---

### Token expired

**Problem:** 90 days passed, token expired

**Solution:**
```bash
# Delete old token
autodeploy github delete

# Create new token
autodeploy github setup
```

**Pro tip:** Set a calendar reminder for 80 days after creation

---

### Can't find token in GitHub

**Problem:** Looking in wrong place

**Solution:**
- **NEW:** Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
- **OLD:** Settings → Developer settings → Personal access tokens → **Tokens (classic)**

AutoDeploy uses **fine-grained tokens** (the new type).

---

## Security Best Practices

### ✅ DO

- Use 90-day expiration
- Select specific repositories only
- Set minimum required permissions
- Regenerate token if compromised
- Store token securely (AutoDeploy does this)

### ❌ DON'T

- Share token with anyone
- Commit token to git
- Use "All repositories" access unless necessary
- Give more permissions than needed
- Use tokens (classic) - they're being deprecated

---

## Multiple Repositories

**Option 1: One Token for All**
- Create token with access to multiple repos
- More convenient
- Slightly less secure

**Option 2: One Token Per Repo**
```bash
# Save different tokens for different projects
autodeploy github setup --scope project-a
autodeploy github setup --scope project-b

# Use specific token
autodeploy deploy --scope project-a
```

---

## Revoking Access

**To delete token from AutoDeploy:**
```bash
autodeploy github delete
```

**To revoke on GitHub:**
1. Go to https://github.com/settings/tokens
2. Find "AutoDeploy Engine" token
3. Click **"Revoke"**
4. Confirm deletion

Token is immediately invalidated everywhere.

---

## FAQ

**Q: Can I use the same token on multiple machines?**

A: Yes, but it's less secure. Better to create a separate token per machine.

**Q: What happens if my token is compromised?**

A: Immediately:
1. Revoke token on GitHub
2. Run `autodeploy github delete`
3. Create new token
4. Update any CI/CD that uses the old token

**Q: Can team members use my token?**

A: No. Each person should create their own token with access to team repositories.

**Q: Does the token work with GitHub Enterprise?**

A: Yes! When setting up, AutoDeploy will detect your GitHub Enterprise URL.

**Q: Why not use classic tokens?**

A: Classic tokens:
- Give access to ALL repositories (less secure)
- Can't limit permissions granularly
- Being deprecated by GitHub
- Fine-grained tokens are the future

---

## Next Steps

1. ✅ Token created and saved
2. ✅ Permissions verified
3. → Run `autodeploy init --auto-setup` to deploy your first project!

---

**Need help?**
- 📖 [Full documentation](https://docs.autodeploy-engine.dev)
- 💬 [Discord community](https://discord.gg/autodeploy)
- 🐛 [Report issues](https://github.com/yourusername/autodeploy-engine/issues)
