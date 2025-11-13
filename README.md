# @enterprise-cmcs/mdct-core

## Sync Files Automation

This repository includes an automated workflow that regularly synchronizes a set of boilerplate files across multiple related applications. The process is designed to ensure that these shared files remain consistent, preventing them from accumulating minor, insubstantial differences over time.

The workflow runs on a schedule and uses a script to compare the standardized files in this repository with their counterparts in each target application. If any differences are detected, the workflow automatically creates a pull request in the affected application to update the files. This helps maintain uniformity and reduces the risk of divergence, making it easier to manage and update shared code or configuration.

By centralizing the management of these files, the sync process streamlines collaboration and keeps all applications aligned with the latest standardized versions.

---

### Key Files

- [Workflow configuration](.github/workflows/sync-files.yml)
- [Sync script](sync-files-github.js)
- [List of target repositories](sync-files-repos.json)
- [Boilerplate files to sync](files-to-sync/)
