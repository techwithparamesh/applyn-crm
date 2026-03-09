/**
 * Documentation navigation structure.
 * Keys are doc slugs used in URL and for loading markdown (e.g. ?section=getting-started → docs/getting-started.md).
 */
export interface DocNavItem {
  id: string;
  title: string;
  children?: DocNavItem[];
}

export const DOCS_NAV: DocNavItem[] = [
  { id: "getting-started", title: "Getting Started" },
  { id: "dashboard", title: "Dashboard" },
  { id: "modules", title: "Modules" },
  { id: "records", title: "Records" },
  { id: "pipelines", title: "Pipelines" },
  { id: "relationships", title: "Relationships" },
  {
    id: "communication",
    title: "Communication",
    children: [
      { id: "email", title: "Email" },
      { id: "whatsapp", title: "WhatsApp" },
    ],
  },
  { id: "tasks", title: "Tasks" },
  { id: "automations", title: "Automations" },
  { id: "forms", title: "Forms" },
  { id: "reports", title: "Reports" },
  { id: "templates", title: "Templates" },
  {
    id: "settings",
    title: "Settings",
    children: [
      { id: "settings-workspace", title: "Workspace" },
      { id: "settings-users", title: "Users" },
      { id: "settings-teams", title: "Teams" },
      { id: "settings-roles", title: "Roles" },
      { id: "settings-api", title: "API" },
    ],
  },
  { id: "integrations", title: "Integrations" },
  { id: "api-documentation", title: "API Documentation" },
];

/** All doc IDs that have a markdown file (parents + leaves). */
export function getAllDocIds(): string[] {
  const ids: string[] = [];
  function walk(items: DocNavItem[]) {
    for (const item of items) {
      ids.push(item.id);
      if (item.children?.length) walk(item.children);
    }
  }
  walk(DOCS_NAV);
  return ids;
}

export const ALL_DOC_IDS = getAllDocIds();
