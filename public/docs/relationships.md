# Relationships

## Overview

Relationships define how modules connect—for example, “Deal belongs to Contact” or “Contact belongs to Company.” Once defined, you can link records from the record detail page and see related records in both directions. Relationships power related-record widgets and reporting.

## Navigation

**Sidebar → Relationships**. The page lists existing relationships and lets you create or edit them.

## UI Components

- **Relationship list** — Source module, target module, relationship type (one-to-many, etc.), and labels.
- **Create / Edit relationship** — Form to set source module, target module, and labels.
- **Related records panel** — On record detail pages; shows linked records and “Link record.”

## User Actions

- Create a relationship between two modules
- Edit relationship labels (e.g. “Contacts” on Company)
- Delete a relationship (links may be removed or orphaned depending on configuration)
- From a record, link or unlink related records using the Related records panel

## Step-by-Step Guide

### How to create a relationship

1. Open **Sidebar → Relationships**.
2. Click **New relationship** (or **Create relationship**).
3. Select **Source module** (e.g. Company) and **Target module** (e.g. Contact).
4. Choose type (e.g. one-to-many: one Company, many Contacts).
5. Set labels (e.g. “Contacts” on Company, “Company” on Contact).
6. Save; the relationship appears in the list and on record detail pages.

### How to link records

1. Open a record (e.g. a Company).
2. In the **Related records** section, find the relationship (e.g. “Contacts”).
3. Click **Link record**, search for a Contact, and select it.
4. The Contact is linked and appears in the related list.

[Screenshot: Relationships configuration]

## Best Practices

- Name relationships clearly (e.g. “Deal → Contact” as “Primary contact”).
- Use one-to-many where one record has many of another (e.g. Company → Contacts).
- Create relationships before importing data so you can link during or after import.
- Use the same relationship in Reports to show related data in one view.
