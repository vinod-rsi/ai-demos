import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "student" | "faculty" | "admin" | "author";

export interface RoleProfile {
  role: Role;
  label: string;
  name: string;
  initials: string;
  meta: string;
  home: string;
}

export const ROLE_PROFILES: Record<Role, RoleProfile> = {
  student: {
    role: "student",
    label: "Student",
    name: "Maya Ellison",
    initials: "ME",
    meta: "BSN · Cohort 2026 · Section A",
    home: "/student",
  },
  faculty: {
    role: "faculty",
    label: "Faculty",
    name: "Dr. Renee Alvarado",
    initials: "RA",
    meta: "Clinical Instructor · Med-Surg",
    home: "/faculty",
  },
  admin: {
    role: "admin",
    label: "Program Admin",
    name: "Jonathan Pierce",
    initials: "JP",
    meta: "Dean of Nursing · Riverside University",
    home: "/admin",
  },
  author: {
    role: "author",
    label: "Content Author",
    name: "Priya Nair",
    initials: "PN",
    meta: "Curriculum Designer · Simulation Lab",
    home: "/author",
  },
};

interface RoleContextValue {
  role: Role;
  profile: RoleProfile;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "swiftriver.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("student");

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? (window.localStorage.getItem(STORAGE_KEY) as Role | null) : null;
    if (stored && stored in ROLE_PROFILES) setRoleState(stored);
  }, []);

  const setRole = (next: Role) => {
    setRoleState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({ role, profile: ROLE_PROFILES[role], setRole }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
