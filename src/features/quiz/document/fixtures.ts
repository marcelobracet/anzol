// Documento completo usado em testes: um step de cada tipo.
export function fullDocumentInput() {
  return {
    schemaVersion: 1,
    theme: {
      colors: {
        primary: "#E11D48",
        background: "#FFFFFF",
        surface: "#F4F4F5",
        text: "#18181B",
        accent: "#F59E0B",
      },
      font: "inter",
      radius: 12,
    },
    offers: [
      {
        id: "offer_main",
        provider: "hotmart",
        fullPriceUrl: "https://pay.hotmart.com/ABC123",
        promo: { url: "https://pay.hotmart.com/ABC123?off=promo", expiresAt: "2099-01-01T00:00:00Z" },
      },
    ],
    settings: { showProgress: true, allowBack: true },
    steps: [
      {
        id: "q_age",
        type: "question",
        name: "Idade",
        title: "Qual a sua idade?",
        selection: { mode: "single" },
        options: [
          { id: "opt_18", label: "18-29", emoji: "🙂", score: 1, tags: ["young"] },
          { id: "opt_30", label: "30+", score: 2 },
        ],
      },
      {
        id: "info_1",
        type: "info",
        name: "Explicação",
        title: "Você não está sozinho",
        body: "**93%** das pessoas…",
        ctaLabel: "Continuar",
      },
      {
        id: "proof_1",
        type: "socialProof",
        name: "Depoimentos",
        items: [
          {
            id: "dep_1",
            image: { kind: "image", publicId: "anzol/dep1", width: 600, height: 900 },
            consentConfirmed: true,
          },
        ],
        ctaLabel: "Quero também",
      },
      {
        id: "lead_1",
        type: "leadForm",
        name: "Captura",
        title: "Para onde enviamos seu resultado?",
        fields: {
          name: { enabled: true, required: true, label: "Nome" },
          email: { enabled: true, required: true, label: "E-mail" },
          phone: { enabled: false, required: false, label: "WhatsApp" },
        },
        ctaLabel: "Ver resultado",
      },
      {
        id: "load_1",
        type: "loading",
        name: "Analisando",
        title: "Analisando suas respostas",
        messages: [{ text: "Cruzando dados…", durationMs: 1200 }],
      },
      {
        id: "result_1",
        type: "result",
        name: "Resultado",
        variants: [
          { id: "var_high", when: { type: "scoreRange", min: 2 }, title: "Perfil avançado" },
        ],
        fallback: { title: "Perfil iniciante" },
        ctaLabel: "Ver minha solução",
      },
      {
        id: "timer_1",
        type: "offerTimer",
        name: "Timer",
        offerId: "offer_main",
        title: "Oferta termina em",
        expiredText: "A oferta promocional acabou",
      },
      {
        id: "vsl_1",
        type: "vsl",
        name: "VSL",
        video: { kind: "video", libraryId: "123", videoId: "abc-def" },
        progressBar: { k: 3 },
        cta: { label: "Quero agora", showAt: 600, offerId: "offer_main" },
        toast: { leadSeconds: 30 },
      },
    ],
  };
}
