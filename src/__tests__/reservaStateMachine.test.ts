import { describe, it, expect } from "vitest";
import { canTransitionTo, VALID_TRANSITIONS } from "@/lib/domain/reservaStateMachine";
import { AgendaStatus } from "@/types";

describe("reservaStateMachine", () => {
  it("allows same-status transition", () => {
    expect(canTransitionTo("Pendente", "Pendente")).toBe(true);
  });

  it("allows valid Pendente transitions", () => {
    expect(canTransitionTo("Pendente", "Aprovado")).toBe(true);
    expect(canTransitionTo("Pendente", "Recusado")).toBe(true);
    expect(canTransitionTo("Pendente", "Cancelado")).toBe(true);
  });

  it("blocks invalid Pendente transitions", () => {
    expect(canTransitionTo("Pendente", "Iniciado")).toBe(false);
    expect(canTransitionTo("Pendente", "Finalizado")).toBe(false);
  });

  it("allows valid Agendado transitions", () => {
    expect(canTransitionTo("Agendado", "Iniciado")).toBe(true);
    expect(canTransitionTo("Agendado", "Cancelado")).toBe(true);
  });

  it("allows valid Aprovado transitions", () => {
    expect(canTransitionTo("Aprovado", "Iniciado")).toBe(true);
    expect(canTransitionTo("Aprovado", "Cancelado")).toBe(true);
  });

  it("allows valid Iniciado transitions", () => {
    expect(canTransitionTo("Iniciado", "Em Trânsito")).toBe(true);
    expect(canTransitionTo("Iniciado", "Finalizado")).toBe(true);
    expect(canTransitionTo("Iniciado", "Concluído")).toBe(true);
  });

  it("allows valid Em Trânsito transitions", () => {
    expect(canTransitionTo("Em Trânsito", "Finalizado")).toBe(true);
    expect(canTransitionTo("Em Trânsito", "Concluído")).toBe(true);
  });

  it("blocks transitions to terminal states from other terminal states", () => {
    expect(canTransitionTo("Finalizado", "Pendente")).toBe(false);
    expect(canTransitionTo("Concluído", "Iniciado")).toBe(false);
    expect(canTransitionTo("Recusado", "Aprovado")).toBe(false);
    expect(canTransitionTo("Cancelado", "Agendado")).toBe(false);
  });

  it("VALID_TRANSITIONS covers all AgendaStatus values", () => {
    const allStatuses: AgendaStatus[] = [
      "Pendente",
      "Agendado",
      "Aprovado",
      "Iniciado",
      "Em Trânsito",
      "Finalizado",
      "Concluído",
      "Recusado",
      "Cancelado",
    ];
    for (const status of allStatuses) {
      expect(VALID_TRANSITIONS[status]).toBeDefined();
      expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true);
    }
  });
});
