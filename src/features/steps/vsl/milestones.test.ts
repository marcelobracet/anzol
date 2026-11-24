import { describe, expect, it } from "vitest";
import { isMilestone, isMilestoneWith, milestoneAt, milestonesUpTo, nextMilestone } from "./milestones";

describe("milestoneAt", () => {
  it("usa passos de 5s no primeiro minuto", () => {
    expect(milestoneAt(0)).toBe(0);
    expect(milestoneAt(4.9)).toBe(0);
    expect(milestoneAt(5)).toBe(5);
    expect(milestoneAt(59.9)).toBe(55);
  });

  it("usa passos de 10s até 5 minutos e 30s depois", () => {
    expect(milestoneAt(60)).toBe(60);
    expect(milestoneAt(79)).toBe(70);
    expect(milestoneAt(299)).toBe(290);
    expect(milestoneAt(300)).toBe(300);
    expect(milestoneAt(359)).toBe(330);
  });

  it("trata valores inválidos como 0", () => {
    expect(milestoneAt(-3)).toBe(0);
    expect(milestoneAt(Number.NaN)).toBe(0);
  });
});

describe("isMilestone", () => {
  it("aceita só pontos da grade", () => {
    expect([0, 5, 55, 60, 70, 290, 300, 330].every(isMilestone)).toBe(true);
    expect([3, 61, 305, -5, 1.5].some(isMilestone)).toBe(false);
  });
});

describe("nextMilestone", () => {
  it("devolve o marco atual só quando passa do último enviado", () => {
    expect(nextMilestone(null, 0.2)).toBe(0);
    expect(nextMilestone(0, 3)).toBeNull();
    expect(nextMilestone(0, 12)).toBe(10);
    expect(nextMilestone(10, 11)).toBeNull();
  });

  it("não reenvia ao recomeçar o vídeo do zero", () => {
    expect(nextMilestone(120, 2)).toBeNull();
  });
});

describe("segundo do botão (CTA) como marco extra", () => {
  // CTA aos 490s cai entre 480 e 510 na grade de 30s: sem o ponto extra, quem para em 495s vira 480.
  it("quem passa do CTA grava o segundo exato do CTA", () => {
    expect(milestoneAt(495, [490])).toBe(490);
    expect(milestoneAt(489, [490])).toBe(480);
    expect(milestoneAt(515, [490])).toBe(510);
    expect(nextMilestone(480, 492, [490])).toBe(490);
    expect(nextMilestone(490, 500, [490])).toBeNull();
  });

  it("aceita o segundo do CTA como marco válido e o inclui na curva", () => {
    expect(isMilestone(490)).toBe(false);
    expect(isMilestoneWith(490, [490])).toBe(true);
    expect(milestonesUpTo(520, [490]).slice(-4)).toEqual([450, 480, 490, 510]);
  });
});
