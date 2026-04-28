# Google Drive Public Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public Google Drive file/folder imports with selectable files, queue-based processing, deduplication, and progress tracking.

**Architecture:** Add Google Drive parsing/listing/download services, import batch persistence, and queue jobs in the package backend. Expose JSON endpoints for preview/start/status and integrate a modal in the existing media page to allow selecting some or all detected files before import.

**Tech Stack:** Laravel package components, queues/jobs, HTTP client, React/Inertia UI, PHPUnit for package tests.

---

### Task 1: Add data model for import tracking and deduplication

**Files:**
- Create: `database/migrations/2026_04_28_000003_add_google_drive_import_columns_to_media_table.php`
- Create: `database/migrations/2026_04_28_000004_create_media_import_batches_table.php`
- Modify: `src/Models/Media.php`

- [ ] Add `source`, `source_id`, `import_batch_id`, and `imported_at` to media records.
- [ ] Add `media_import_batches` table with status counters and metadata payload.
- [ ] Update model fillable/casts for new fields.

### Task 2: Build Google Drive public-link services

**Files:**
- Create: `src/GoogleDrive/GoogleDriveLinkParser.php`
- Create: `src/GoogleDrive/GoogleDrivePublicClient.php`
- Modify: `config/media-library.php`

- [ ] Implement URL parsing for file and folder links.
- [ ] Implement folder listing through Google Drive API key.
- [ ] Implement direct-download resolution for file IDs.
- [ ] Add config for API key, limits, and allowed mime types.

### Task 3: Implement importer workflow and queue job

**Files:**
- Create: `src/Jobs/ImportGoogleDriveFile.php`
- Create: `src/Services/GoogleDriveImportService.php`
- Create: `src/Models/MediaImportBatch.php`

- [ ] Create a service to preview a link and produce import candidates.
- [ ] Queue one job per selected file.
- [ ] Import into storage and create media records.
- [ ] Skip duplicates by `source=google_drive` + `source_id`.
- [ ] Track per-batch counts for pending/imported/failed/skipped.

### Task 4: Expose API endpoints for preview/start/status

**Files:**
- Create: `src/Http/Controllers/GoogleDriveImportController.php`
- Modify: `routes/web.php`

- [ ] Add JSON endpoint to preview a file/folder link.
- [ ] Add JSON endpoint to start selected/all imports.
- [ ] Add JSON endpoint to poll import batch status.

### Task 5: Add media page UI for paste, select, and import

**Files:**
- Modify: `resources/js/pages/admin/media/index.tsx`

- [ ] Add "Import from Google Drive" button and modal.
- [ ] Add link preview action and selectable list checkboxes.
- [ ] Add "Select All" support.
- [ ] Add import trigger and status polling UX.

### Task 6: Add tests (TDD slices)

**Files:**
- Modify: `composer.json`
- Create: `phpunit.xml.dist`
- Create: `tests/Unit/GoogleDriveLinkParserTest.php`
- Create: `tests/Unit/GoogleDrivePublicClientTest.php`

- [ ] Add package test dependencies and test bootstrap.
- [ ] Add parser coverage for file/folder URL extraction.
- [ ] Add client behavior tests for response parsing/fallbacks.
