# MySQL API Server

This Express server exposes a REST API that uses **MySQL** instead of Supabase for CRM data. The frontend can be switched to use this API by setting `VITE_USE_MYSQL_API=true`.

## Setup

1. **Install dependencies** (from project root):
   ```bash
   npm install
   ```

2. **Create the MySQL database** and run the schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p crm < database/mysql_schema.sql
   ```

3. **Configure environment** (project root `.env` or `server/.env`):
   ```env
   # MySQL
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=crm

   # JWT secret (from Supabase Dashboard → Settings → API → JWT Secret)
   # Used to verify the Supabase access token sent by the frontend
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   # Or use a generic name:
   # JWT_SECRET=your-supabase-jwt-secret

   # Optional: server port (default 3001)
   PORT=3001
   ```

4. **Run the server** (from project root):
   ```bash
   npm run server
   ```
   The API will be at `http://localhost:3001`.

5. **Enable MySQL in the frontend** (in `.env`):
   ```env
   VITE_USE_MYSQL_API=true
   VITE_API_URL=http://localhost:3001
   ```

6. **Run the frontend** (in another terminal):
   ```bash
   npm run dev
   ```

Login and signup still use **Supabase Auth**. The app sends the Supabase access token in the `Authorization` header; the server verifies it and loads the user’s profile from MySQL to get `tenant_id`, then runs all queries scoped to that tenant.

## API routes

All routes under `/api` require `Authorization: Bearer <supabase_access_token>`.

- `GET/POST/PATCH/DELETE /api/crm_records` – records (list, create, update, soft delete)
- `GET /api/search_records` – search (replaces Supabase `search_records` RPC)
- `GET/POST/PATCH/DELETE /api/modules`, `/api/module_fields`
- `GET/POST/PATCH/DELETE /api/profiles`, `POST /api/tenants`
- `GET/POST/PATCH/DELETE /api/roles`, `/api/role_permissions`, `/api/user_roles`
- `GET/POST/PATCH/DELETE /api/pipelines`, `/api/pipeline_stages`
- `GET/POST/PATCH/DELETE /api/tasks`, `/api/notes`, `/api/files`
- `GET/POST/DELETE /api/dashboards`, `/api/dashboard_widgets`
- `GET/POST/PATCH/DELETE /api/reports`, `/api/api_keys`
- `GET/POST/PATCH/DELETE /api/automations`, `/api/automation_conditions`, `/api/automation_actions`
- `GET/POST/DELETE /api/teams`, `/api/team_members`, `/api/invitations`
- `GET/POST/DELETE /api/record_tags`, `/api/installed_templates`
- Email: `/api/email_accounts`, `/api/emails`, `/api/email_record_links`, `/api/email_attachments`
- Import: `/api/import_jobs`, `/api/import_errors`, `POST /api/crm_records/bulk`
- WhatsApp: `/api/whatsapp_accounts`, `/api/whatsapp_conversations`, `/api/whatsapp_messages`

See `database/mysql_setup.md` for schema and tenant isolation details.

## Frontend hooks updated for MySQL

When `VITE_USE_MYSQL_API=true`, these hooks use the MySQL API: **useRecords**, **useModulesCRUD**, **AuthProvider** (profiles/tenants), **useRBAC**, **usePipelines**, **useTasks**, **useNotes**, **useApiKeys**, **useGlobalSearch**. Other hooks (e.g. useDashboards, useReports, useAutomations, useUserManagement, useRecordEmails, useEmailSync, useImportExport, useTemplateInstaller, useTags, useWhatsApp, useFiles) still call Supabase; you can add the same `isUsingMySQL()` + `api.get/post/patch/delete` pattern to switch them too. File and avatar uploads still use Supabase Storage unless you add upload endpoints to the server.
