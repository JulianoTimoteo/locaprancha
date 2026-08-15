import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canAccessTab,
  isGod,
  isAdmin,
  canManageUsers,
  canManageFleet,
  canAccessDeveloper,
  isActive,
  DEFAULT_PERMISSIONS_BY_ROLE,
} from "@/lib/permissions/permissions";
import { UserProfile, UserRole } from "@/types";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: "test-uid",
    name: "Test User",
    nickname: "testuser",
    email: "test@example.com",
    emailTipo: "REAL",
    role: "SOLICITANTE",
    permissions: [],
    status: "ATIVO",
    criadoEm: null,
    atualizadoEm: null,
    ultimoAcesso: null,
    ...overrides,
  };
}

describe("permissions", () => {
  it("returns false for null profile", () => {
    expect(hasPermission(null, "dashboard")).toBe(false);
    expect(isGod(null)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("GOD has access to everything", () => {
    const god = makeProfile({ role: "GOD" });
    expect(isGod(god)).toBe(true);
    expect(isAdmin(god)).toBe(true);
    expect(canAccessDeveloper(god)).toBe(true);
  });

  it("ADMINISTRADOR has admin access but not developer", () => {
    const admin = makeProfile({ role: "ADMINISTRADOR" });
    expect(isGod(admin)).toBe(false);
    expect(isAdmin(admin)).toBe(true);
    expect(hasPermission(admin, "usuarios")).toBe(true);
    expect(canAccessDeveloper(admin)).toBe(false);
  });

  it("LIDER has fleet and reservation access", () => {
    const lider = makeProfile({ role: "LIDER" });
    expect(isAdmin(lider)).toBe(false);
    expect(canManageFleet(lider)).toBe(true);
    expect(hasPermission(lider, "pranchas")).toBe(true);
    expect(hasPermission(lider, "usuarios")).toBe(false);
  });

  it("SOLICITANTE has limited access", () => {
    const solicitante = makeProfile({ role: "SOLICITANTE" });
    expect(hasPermission(solicitante, "dashboard")).toBe(true);
    expect(hasPermission(solicitante, "reservas")).toBe(true);
    expect(hasPermission(solicitante, "usuarios")).toBe(false);
  });

  it("MOTORISTA has limited access", () => {
    const motorista = makeProfile({ role: "MOTORISTA" });
    expect(hasPermission(motorista, "dashboard")).toBe(true);
    expect(hasPermission(motorista, "reservas")).toBe(true);
    expect(hasPermission(motorista, "usuarios")).toBe(false);
  });

  it("blocked user loses all permissions", () => {
    const blocked = makeProfile({ status: "BLOQUEADO", role: "ADMINISTRADOR" });
    expect(isActive(blocked)).toBe(false);
    expect(hasPermission(blocked, "dashboard")).toBe(false);
    expect(canManageUsers(blocked)).toBe(false);
  });

  it("custom permissions override role defaults", () => {
    const custom = makeProfile({
      role: "SOLICITANTE",
      permissions: ["dashboard", "reservas", "usuarios"],
    });
    expect(hasPermission(custom, "usuarios")).toBe(true);
    expect(hasPermission(custom, "relatorios")).toBe(false);
  });

  it("DEFAULT_PERMISSIONS_BY_ROLE covers all roles", () => {
    const roles: UserRole[] = ["GOD", "ADMINISTRADOR", "LIDER", "MOTORISTA", "SOLICITANTE"];
    for (const role of roles) {
      expect(DEFAULT_PERMISSIONS_BY_ROLE[role]).toBeDefined();
      expect(Array.isArray(DEFAULT_PERMISSIONS_BY_ROLE[role])).toBe(true);
    }
  });
});
