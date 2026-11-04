import { describe, expect, it, vi } from "vitest";
import { createVercelDomains } from "./vercel-client";

const config = { token: "tok_123", projectId: "prj_abc", teamId: "team_x" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("createVercelDomains.add", () => {
  it("cadastra o domínio no projeto com token e teamId", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(200, { name: "oferta.com", verified: true }));
    const result = await createVercelDomains(config, fetchFn).add("oferta.com");
    expect(result).toEqual({ verified: true, verification: [] });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.vercel.com/v10/projects/prj_abc/domains?teamId=team_x");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok_123");
    expect(JSON.parse(init.body)).toEqual({ name: "oferta.com" });
  });

  it("devolve os registros de verificação pendentes", async () => {
    const verification = [{ type: "TXT", domain: "_vercel.oferta.com", value: "vc-domain-verify=..." }];
    const fetchFn = vi.fn().mockResolvedValue(json(200, { verified: false, verification }));
    expect(await createVercelDomains(config, fetchFn).add("oferta.com")).toEqual({ verified: false, verification });
  });

  it("domínio já no projeto (409) é sucesso", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json(409, { error: { code: "domain_already_in_use", message: "já existe" } }))
      .mockResolvedValueOnce(json(200, { name: "oferta.com", verified: true }));
    expect(await createVercelDomains(config, fetchFn).add("oferta.com")).toEqual({ verified: true, verification: [] });
    expect(fetchFn.mock.calls[1][0]).toBe("https://api.vercel.com/v9/projects/prj_abc/domains/oferta.com?teamId=team_x");
  });

  it("domínio em uso por outro projeto vira erro legível", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json(409, { error: { code: "domain_already_in_use", message: "Domain is in use" } }))
      .mockResolvedValueOnce(json(404, { error: { message: "not found" } }));
    await expect(createVercelDomains(config, fetchFn).add("oferta.com")).rejects.toThrow(/Domain is in use/);
  });

  it("sem teamId não manda o parâmetro", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(200, { verified: true }));
    await createVercelDomains({ ...config, teamId: undefined }, fetchFn).add("oferta.com");
    expect(fetchFn.mock.calls[0][0]).toBe("https://api.vercel.com/v10/projects/prj_abc/domains");
  });
});
