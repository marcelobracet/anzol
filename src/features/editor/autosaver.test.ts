import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosaver, type AutosaveStatus } from "./autosaver";

let statuses: AutosaveStatus[];
let save: ReturnType<typeof vi.fn>;

function build() {
  return createAutosaver<string>({ save, delayMs: 500, onStatus: (s) => statuses.push(s) });
}

beforeEach(() => {
  vi.useFakeTimers();
  statuses = [];
  save = vi.fn().mockResolvedValue({ success: true });
});
afterEach(() => vi.useRealTimers());

describe("createAutosaver", () => {
  it("espera o intervalo e salva só o último valor", async () => {
    const saver = build();
    saver.schedule("a");
    saver.schedule("b");
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("b");
    expect(statuses).toEqual(["pending", "pending", "saving", "saved"]);
  });

  it("nunca salva em paralelo: o valor que chega durante o save vai em seguida", async () => {
    let finish: (v: { success: true }) => void = () => {};
    save.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    const saver = build();
    saver.schedule("a");
    await vi.advanceTimersByTimeAsync(500);
    saver.schedule("b");
    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
    finish({ success: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenLastCalledWith("b");
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("flush salva na hora e informa se deu certo", async () => {
    const saver = build();
    saver.schedule("a");
    await expect(saver.flush()).resolves.toBe(true);
    expect(save).toHaveBeenCalledWith("a");
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flush sem nada pendente resolve true sem salvar", async () => {
    await expect(build().flush()).resolves.toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it("erro vira status error com a mensagem e flush resolve false", async () => {
    save.mockResolvedValue({ success: false, error: "Conflito" });
    const errors: (string | undefined)[] = [];
    const saver = createAutosaver<string>({ save, delayMs: 500, onStatus: (s, e) => (statuses.push(s), errors.push(e)) });
    saver.schedule("a");
    await expect(saver.flush()).resolves.toBe(false);
    expect(statuses.at(-1)).toBe("error");
    expect(errors.at(-1)).toBe("Conflito");
  });

  it("exceção de rede também vira error", async () => {
    save.mockRejectedValue(new Error("offline"));
    const saver = build();
    saver.schedule("a");
    await expect(saver.flush()).resolves.toBe(false);
    expect(statuses.at(-1)).toBe("error");
  });

  it("dispose cancela o save agendado", async () => {
    const saver = build();
    saver.schedule("a");
    saver.dispose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).not.toHaveBeenCalled();
  });
});
