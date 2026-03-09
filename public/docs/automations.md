# Automations

## Overview

Automations run workflows based on triggers and conditions. When something happens (e.g. record created, stage changed), the automation can run actions such as sending an email, creating a task, or updating a field. This reduces manual work and keeps processes consistent.

## Navigation

**Sidebar → Workspace → Automations**. Click an automation to open the builder.

## UI Components

- **Automation list** — Name, trigger type, status (on/off), edit/delete.
- **Automation builder** — Visual flow: trigger, conditions (optional), actions.
- **Trigger** — Event that starts the automation (e.g. record created, stage changed).
- **Conditions** — Rules that must be true for actions to run (e.g. “Stage is Won”).
- **Actions** — What runs (e.g. send email, create task, update field).

## User Actions

- Create an automation and choose trigger and module
- Add conditions (field equals, stage is, etc.)
- Add one or more actions (email, task, update field, etc.)
- Turn automations on or off
- View run history or logs
- Edit or delete automations

## Step-by-Step Guide

### How to create an automation

1. Open **Sidebar → Workspace → Automations**.
2. Click **New automation** (or **Create automation**).
3. Enter a **Name** and select the **Module** and **Trigger** (e.g. “Record created” or “Stage changed”).
4. Optionally add **Conditions** (e.g. “Stage equals Won”).
5. Add **Actions** (e.g. “Send email” or “Create task”).
6. Save and turn the automation **On**; it will run when the trigger fires and conditions are met.

### How to add a condition

1. Open the automation in the **Automation builder**.
2. Click **Add condition** (or the + between trigger and actions).
3. Choose field and operator (e.g. Stage → equals → Won).
4. Save; the automation runs only when this condition is true.

[Screenshot: Automation builder]

## Best Practices

- Start with one trigger and one action; add conditions and more actions as needed.
- Use clear names so you can find and debug automations later.
- Test with a single record before relying on an automation for bulk data.
- Turn off automations temporarily when doing large imports or bulk updates.
