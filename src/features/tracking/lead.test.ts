import { describe, expect, it } from "vitest";
import { defaultPhoneCountry, normalizeLead } from "./lead";

const fields = {
  name: { enabled: true, required: true },
  email: { enabled: true, required: true },
  phone: { enabled: true, required: false },
};

describe("normalizeLead", () => {
  it("normaliza e-mail e telefone em E.164 pelo país do locale", () => {
    const result = normalizeLead({ name: "  Ana  Maria ", email: " Ana@Mail.COM ", phone: "55 1234 5678" }, fields, "MX");
    expect(result).toEqual({ success: true, data: { name: "Ana Maria", email: "ana@mail.com", phone: "+525512345678" } });
  });

  it("aceita telefone já em formato internacional", () => {
    const result = normalizeLead({ name: "Ana", email: "a@b.co", phone: "+34 612 34 56 78" }, fields, "MX");
    expect(result.success && result.data.phone).toBe("+34612345678");
  });

  it("aponta campos obrigatórios vazios e formatos inválidos", () => {
    const result = normalizeLead({ name: "", email: "nao-é-email", phone: "123" }, fields, "BR");
    expect(result).toEqual({ success: false, errors: { name: "required", email: "invalid", phone: "invalid" } });
  });

  it("ignora campos desabilitados e opcionais vazios", () => {
    const result = normalizeLead(
      { name: "Ana", email: "x", phone: "" },
      { ...fields, email: { enabled: false, required: true } },
      "BR",
    );
    expect(result).toEqual({ success: true, data: { name: "Ana" } });
  });
});

describe("defaultPhoneCountry", () => {
  it("usa o país do locale", () => {
    expect(defaultPhoneCountry("es-AR")).toBe("AR");
    expect(defaultPhoneCountry("pt-BR")).toBe("BR");
  });
});
