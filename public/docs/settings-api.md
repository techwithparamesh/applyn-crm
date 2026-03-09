# Settings: API

## Overview

The API settings page lets you create and manage **API keys** for programmatic access to your CRM. Use keys to authenticate requests to the REST API (e.g. create or update records from another app, sync data, or build integrations). Keys are secret; create and revoke them from Settings → API.

## Navigation

**Sidebar → Settings → API** tab.

## UI Components

- **API key list** — Name, last used (if tracked), created date; copy, reveal, revoke.
- **Create key** — Name for the key; after creation the full key is shown once (copy it then).
- **Base URL** — Shown for reference (e.g. `https://your-project.supabase.co/functions/v1/api-records`).

## User Actions

- Create a new API key (with a descriptive name)
- Copy the key to use in requests (only full key shown at creation)
- Reveal or mask existing keys (partial display for security)
- Revoke (delete) a key when it’s no longer needed

## Step-by-Step Guide

### How to create an API key

1. Open **Settings → API**.
2. Click **Create API key** (or **New key**).
3. Enter a **Name** (e.g. “Integration: Zapier”).
4. Create; the **full key** is displayed once. Copy and store it securely (e.g. in a password manager or your app’s env). It won’t be shown again in full.

### How to use the API

1. Use the **Base URL** shown on the API settings page (e.g. for records: `/functions/v1/api-records`).
2. Send requests with header: `X-API-Key: your-api-key`.
3. See **API Documentation** in the docs for endpoints, body format, and examples.

[Screenshot: API keys list]

## Best Practices

- Name keys by purpose (e.g. “Production sync”, “Zapier”) so you can revoke the right one.
- Never commit API keys to code or public repos; use environment variables.
- Rotate keys periodically and revoke keys that are no longer used.
- Create separate keys per integration so you can revoke one without affecting others.
