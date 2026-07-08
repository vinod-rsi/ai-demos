import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BarChart3,
  PencilRuler,
  MessageSquareText,
  Settings,
  Search,
  Bell,
  Sparkles,
  ChevronsUpDown,
  Waves,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRole, ROLE_PROFILES, type Role } from "@/lib/role-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/prototype/StatusBadge";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

const navByRole: Record<Role, NavItem[]> = {
  student: [
    { label: "Overview", to: "/", icon: LayoutDashboard },
    { label: "My Simulations", to: "/student", icon: GraduationCap },
    { label: "Debrief & Remediation", to: "/debrief", icon: MessageSquareText },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  faculty: [
    { label: "Overview", to: "/", icon: LayoutDashboard },
    { label: "Faculty Dashboard", to: "/faculty", icon: Users },
    { label: "Debrief & Remediation", to: "/debrief", icon: MessageSquareText },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
  admin: [
    { label: "Overview", to: "/", icon: LayoutDashboard },
    { label: "Outcomes Dashboard", to: "/admin", icon: BarChart3 },
    { label: "Governance", to: "/settings", icon: Settings },
  ],
  author: [
    { label: "Overview", to: "/", icon: LayoutDashboard },
    { label: "Scenario Authoring", to: "/author", icon: PencilRuler },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
};

const roleTone: Record<Role, string> = {
  student: "info",
  faculty: "primary",
  admin: "ai",
  author: "success",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, profile, setRole } = useRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = navByRole[role];

  const handleRoleChange = (next: Role) => {
    setRole(next);
    navigate({ to: ROLE_PROFILES[next].home });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/90 text-sidebar-primary-foreground">
            <Waves className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Swift River</p>
            <p className="text-[11px] text-sidebar-foreground/70">Adaptive Sim Engine</p>
          </div>
        </div>

        <div className="px-3">
          <p className="px-2 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {profile.label} workspace
          </p>
          <nav className="flex flex-col gap-0.5">
            {items.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white",
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-3">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-sidebar-primary" />
              Adaptive Engine
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Personalizing 6 live sessions
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top utility bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waves className="h-4.5 w-4.5" />
            </span>
          </Link>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search scenarios, learners, outcomes…"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <StatusBadge tone="ai" dot className="hidden sm:inline-flex">
              AI Engine · Live
            </StatusBadge>

            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-critical" />
            </button>

            {/* Role switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-background py-1 pl-1 pr-2 text-left transition-colors hover:bg-muted">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {profile.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden leading-tight sm:block">
                    <p className="text-xs font-semibold">{profile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{profile.label}</p>
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Switch role (demo)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(ROLE_PROFILES) as Role[]).map((r) => {
                  const p = ROLE_PROFILES[r];
                  return (
                    <DropdownMenuItem
                      key={r}
                      onSelect={() => handleRoleChange(r)}
                      className="flex items-center gap-2.5 py-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-[11px] font-semibold">
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{p.meta}</p>
                      </div>
                      {r === role && (
                        <StatusBadge tone={roleTone[r]} className="ml-auto">
                          Active
                        </StatusBadge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
