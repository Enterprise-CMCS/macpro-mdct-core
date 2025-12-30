# File Sync Scripts

This directory contains scripts to sync standardized files from `files-to-sync/` to all MDCT repos.

## Local Sync (Recommended for Development)

The local sync script copies files directly to your local repo directories without creating PRs or touching GitHub.

### Quick Start

```bash
# Sync to all 6 repos (carts, qmr, hcbs, mcr, mfp, seds)
yarn sync-local

# Or directly with node
node sync-files-local.ts
```

### Sync to Specific Repos

```bash
# Sync to just a few repos
REPOS="carts,qmr" yarn sync-local

# Or with custom list
REPOS="hcbs,mfp" node sync-files-local.ts
```

### How It Works

- Looks for repos in the parent directory (e.g., `/Users/jon.holman/Projects/`)
- Compares SHA256 hashes of source and target files
- Only copies files that differ or don't exist
- Shows detailed output of what was changed
- **Does NOT** create git commits or branches
- **Does NOT** touch GitHub

### Example Output

```
🔄 Starting local file sync...

📂 Source: /Users/jon.holman/Projects/macpro-mdct-core/files-to-sync
📂 Target: /Users/jon.holman/Projects

📋 Repos to sync: macpro-mdct-carts, macpro-mdct-qmr

🔍 Syncing macpro-mdct-carts...
  ✓ Updated: cli/commands/local.ts
  ✓ Updated: cli/commands/watch.ts
  ✨ Created: cli/commands/deploy.ts
  ✨ Created: cli/lib/optional-imports.ts
  ✓ Done: 2 created, 2 updated

🔍 Syncing macpro-mdct-qmr...
  ✓ Already up to date

...

✨ Local sync complete!
```

## GitHub Sync (GitHub Actions)

The GitHub sync script creates PRs in target repos. This runs automatically via GitHub Actions.

### Manual GitHub Sync

```bash
# Requires GITHUB_TOKEN
GITHUB_TOKEN=github_pat_YOUR_TOKEN yarn sync-github
```

### Configuration

Edit `sync-files-repos.json` to control which repos receive automated PRs:

```json
{
  "repos": [
    "Enterprise-CMCS/macpro-mdct-carts",
    "Enterprise-CMCS/macpro-mdct-qmr",
    "Enterprise-CMCS/macpro-mdct-hcbs",
    "Enterprise-CMCS/macpro-mdct-mcr",
    "Enterprise-CMCS/macpro-mdct-mfp",
    "Enterprise-CMCS/macpro-mdct-seds"
  ]
}
```

### How It Works

- Clones each repo to a temp directory
- Creates a new branch with sync changes
- Pushes branch to GitHub
- Creates a PR if changes were made
- Skips if an open sync PR already exists

## What Gets Synced

All files and directories in `files-to-sync/` are synced, maintaining the same directory structure:

- `cli/commands/` - CLI command files
- `cli/lib/` - CLI library utilities
- `deployment/` - CDK deployment code
- `.github/` - GitHub workflows and actions
- And more...

## Development Workflow

1. Make changes to files in `files-to-sync/`
2. Test locally: `yarn sync-local`
3. Review changes in target repos
4. Commit changes to both core and target repos
5. When ready, let GitHub Actions sync to remaining repos
