import { type ReactNode, useState } from "react";
import {
  Calendar,
  GraduationCap,
  Laptop,
  Table as TableIcon,
  Users,
  LifeBuoy,
  SlidersHorizontal,
  BookOpen,
  Wrench,
  ChevronDown,
  ChevronRight,
  Sparkles,
  User,
} from "lucide-react";

type NavChild = { label: string; active?: boolean };
type NavItem = {
  label: string;
  icon: typeof Calendar;
  children?: NavChild[];
  defaultOpen?: boolean;
  active?: boolean;
};

const NAV: NavItem[] = [
  { label: "Training Schedule", icon: Calendar },
  {
    label: "Instructor Led",
    icon: GraduationCap,
    children: [{ label: "Events" }, { label: "Classroom Links" }],
  },
  {
    label: "Self-Paced",
    icon: Laptop,
    children: [
      { label: "Learning Series" },
      { label: "Lab Sessions" },
      { label: "StateSaves" },
      { label: "Dynamic" },
    ],
  },
  {
    label: "Template Management",
    icon: TableIcon,
    children: [
      { label: "Templates" },
      { label: "Reorder Templates" },
      { label: "Lab Configurations" },
      { label: "Walkthroughs" },
    ],
  },
  {
    label: "User Management",
    icon: Users,
    children: [{ label: "Users" }, { label: "User Groups" }, { label: "Cohorts" }],
  },
  { label: "Support", icon: LifeBuoy, children: [{ label: "FAQs" }, { label: "Support Requests" }] },
  {
    label: "Authoring",
    icon: SlidersHorizontal,
    active: true,
    defaultOpen: true,
    children: [
      { label: "AI Lab Assistant", active: true },
      { label: "Content" },
      { label: "Pages" },
      { label: "Menus" },
    ],
  },
  { label: "Reports", icon: BookOpen, children: [{ label: "Generate Report" }] },
  { label: "Site Settings", icon: Wrench, children: [{ label: "General Settings" }] },
];

function NavGroup({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(!!item.defaultOpen);
  const Icon = item.icon;
  if (!item.children) {
    return (
      <li>
        <button className="flex w-full items-center gap-3 px-5 py-2.5 text-[13px] text-sidebar-foreground hover:bg-sidebar-active transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{item.label}</span>
        </button>
      </li>
    );
  }
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 px-5 py-2.5 text-[13px] hover:bg-sidebar-active transition-colors ${
          item.active ? "bg-sidebar-active font-semibold text-foreground" : "text-sidebar-foreground"
        }`}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <ul className="bg-secondary/40">
          {item.children.map((c) => (
            <li key={c.label}>
              <button
                className={`block w-full py-2 pl-12 pr-4 text-left text-[13px] hover:bg-sidebar-active transition-colors ${
                  c.active ? "text-brand font-semibold" : "text-sidebar-foreground"
                }`}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function AdminShell({
  section,
  page,
  description,
  tabs,
  children,
}: {
  section: string;
  page: string;
  description?: string;
  tabs?: { label: string; active?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-[120px] items-center justify-center border-b border-border px-6">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold tracking-tight text-foreground">Hat<span className="text-brand">s</span>i<span className="text-brand">z</span>e</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <ul>
            {NAV.map((item) => (
              <NavGroup key={item.label} item={item} />
            ))}
          </ul>
        </nav>
        <div className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
          <div className="space-y-0.5">
            <div><span className="font-semibold text-foreground">Date:</span> 2026-05-28 14:02 UTC</div>
            <div><span className="font-semibold text-foreground">Build:</span> 7412</div>
            <div><span className="font-semibold text-foreground">Branch:</span> release/2026.2</div>
          </div>
          <div className="mt-3 leading-tight">Copyright 2026 Jones & Bartlett Learning.<br />All Rights Reserved.</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="bg-brand text-brand-foreground">
          <div className="flex items-center justify-between px-8 pt-5">
            <div className="flex items-center gap-3 text-[17px] font-semibold">
              <span>{section}</span>
              <ChevronRight className="h-4 w-4 opacity-80" />
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {page}
              </span>
            </div>
            <button className="inline-flex items-center gap-2 text-[13px] opacity-95 hover:opacity-100">
              <User className="h-4 w-4" />
              jsmith
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          {description && (
            <p className="mt-1 max-w-2xl px-8 text-xs text-brand-foreground/75">
              {description}
            </p>
          )}
          {tabs && (
            <div className="mt-4 flex gap-8 px-8">
              {tabs.map((t) => (
                <button
                  key={t.label}
                  className={`relative pb-3 text-[12px] font-bold uppercase tracking-wider transition-colors ${
                    t.active ? "text-brand-foreground" : "text-brand-foreground/70 hover:text-brand-foreground"
                  }`}
                >
                  {t.label}
                  {t.active && (
                    <span className="absolute -bottom-px left-0 right-0 h-[3px] bg-brand-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
