import { describe, expect, it } from "vitest";
import { buildRetention } from "./retention";

// Histograma: quantas sessões pararam em cada segundo máximo assistido.
const rows = [
  { maxSecond: 0, sessions: 20 }, // deram play e saíram logo
  { maxSecond: 10, sessions: 30 },
  { maxSecond: 60, sessions: 25 },
  { maxSecond: 150, sessions: 25 }, // viram até o CTA
];

describe("buildRetention", () => {
  it("sem dados devolve curva vazia", () => {
    const r = buildRetention([], { views: 0, ctaAt: 150 });
    expect(r.starts).toBe(0);
    expect(r.points).toEqual([]);
    expect(r.halfSecond).toBeNull();
    expect(r.reachedCta).toBe(0);
  });

  it("calcula quantos ainda assistiam em cada marco, em relação a quem deu play", () => {
    const r = buildRetention(rows, { views: 200, ctaAt: 150 });
    expect(r.starts).toBe(100);
    expect(r.playRate).toBe(0.5);
    const at = (s: number) => r.points.find((p) => p.second === s);
    expect(at(0)).toEqual({ second: 0, sessions: 100, share: 1 });
    expect(at(5)).toEqual({ second: 5, sessions: 80, share: 0.8 });
    expect(at(10)).toEqual({ second: 10, sessions: 80, share: 0.8 });
    expect(at(15)).toEqual({ second: 15, sessions: 50, share: 0.5 });
    expect(at(150)).toEqual({ second: 150, sessions: 25, share: 0.25 });
    expect(r.points.at(-1)?.second).toBe(150);
  });

  it("acha o momento em que metade já saiu e quantos chegaram ao CTA", () => {
    const r = buildRetention(rows, { views: 200, ctaAt: 150 });
    expect(r.halfSecond).toBe(15); // primeiro marco com 50% ou menos
    expect(r.reachedCta).toBe(0.25);
  });

  it("lista as maiores quedas entre marcos consecutivos", () => {
    const r = buildRetention(rows, { views: 200, ctaAt: 150 });
    expect(r.drops[0]).toEqual({ from: 10, to: 15, lost: 30, share: 0.3 });
    expect(r.drops.map((d) => d.from)).toEqual([10, 60, 0]);
  });

  it("estende a curva até o CTA quando ninguém chegou lá", () => {
    const r = buildRetention([{ maxSecond: 20, sessions: 4 }], { views: 4, ctaAt: 40 });
    expect(r.points.at(-1)).toEqual({ second: 40, sessions: 0, share: 0 });
    expect(r.halfSecond).toBe(25);
  });

  it("taxa de play não passa de 100% mesmo se views vier menor", () => {
    expect(buildRetention(rows, { views: 10, ctaAt: 150 }).playRate).toBe(1);
  });
});
