// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readWatched, saveWatched, subscribeWatched } from "./watched-store";

beforeEach(() => window.localStorage.clear());

describe("watched-store", () => {
  it("guarda só o máximo, em segundos inteiros", () => {
    saveWatched("a", 12.7);
    saveWatched("a", 5);
    expect(readWatched("a")).toBe(12);
    expect(window.localStorage.getItem("anzol:vsl:a")).toBe("12");
  });

  it("avisa os inscritos só quando aumenta", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeWatched(listener);
    saveWatched("b", 10);
    saveWatched("b", 3);
    unsubscribe();
    saveWatched("b", 20);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("sem storage, continua em memória", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    saveWatched("c", 30);
    expect(readWatched("c")).toBe(30);
    spy.mockRestore();
  });
});
