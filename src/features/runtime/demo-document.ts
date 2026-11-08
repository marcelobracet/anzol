import { QuizDocument } from "@/features/quiz/document/schema";

// Quiz de demonstração: servido em demo.localhost fora de produção e usado nos testes do runtime.
export function demoDocument(): QuizDocument {
  return QuizDocument.parse({
    schemaVersion: 1,
    theme: {
      colors: { primary: "#E11D48", background: "#FFFFFF", surface: "#F4F4F5", text: "#18181B", accent: "#F59E0B" },
      font: "inter",
      radius: 14,
    },
    settings: { showProgress: true, allowBack: true },
    steps: [
      {
        id: "intro",
        type: "info",
        name: "Abertura",
        title: "Descubra seu perfil em 1 minuto",
        body: "Responda **2 perguntas** rápidas.\nNo final você recebe um ==diagnóstico personalizado==.",
        ctaLabel: "Começar",
      },
      {
        id: "q_goal",
        type: "question",
        name: "Objetivo",
        title: "Qual é o seu principal objetivo?",
        selection: { mode: "single" },
        options: [
          { id: "goal_money", label: "Ganhar mais dinheiro", emoji: "💰", score: 2, tags: ["money"] },
          { id: "goal_time", label: "Ter mais tempo livre", emoji: "⏳", score: 1, tags: ["time"] },
          { id: "goal_both", label: "Os dois", emoji: "🚀", score: 3, tags: ["money", "time"] },
        ],
      },
      {
        id: "q_blockers",
        type: "question",
        name: "Obstáculos",
        title: "O que mais te atrapalha hoje?",
        subtitle: "Escolha até 2.",
        selection: { mode: "multi", min: 1, max: 2, ctaLabel: "Continuar" },
        layout: "grid",
        options: [
          { id: "b_focus", label: "Falta de foco", emoji: "🎯", score: 1 },
          { id: "b_method", label: "Falta de método", emoji: "🧭", score: 2, tags: ["money"] },
          { id: "b_time", label: "Pouco tempo", emoji: "⌛", score: 1, tags: ["time"] },
          { id: "b_fear", label: "Medo de errar", emoji: "😬", score: 1 },
        ],
      },
      {
        id: "loading",
        type: "loading",
        name: "Análise",
        title: "Analisando suas respostas…",
        messages: [
          { text: "Cruzando suas respostas", durationMs: 1200 },
          { text: "Comparando com 12.000 perfis", durationMs: 1200 },
          { text: "Montando seu diagnóstico", durationMs: 1000 },
        ],
      },
      {
        id: "result",
        type: "result",
        name: "Resultado",
        variants: [
          {
            id: "r_money",
            when: { type: "tag", tag: "money", minCount: 2 },
            title: "Perfil Acelerador",
            body: "Você respondeu **{{answer.q_goal}}**. Seu ponto de alavanca é *método*.",
          },
          {
            id: "r_high",
            when: { type: "scoreRange", min: 4 },
            title: "Perfil Construtor",
            body: "Você já tem clareza. Falta ==consistência==.",
          },
        ],
        fallback: { title: "Perfil Explorador", body: "Você está começando, e isso é ótimo." },
        ctaLabel: "Ver próximo passo",
      },
    ],
  });
}

// Demo da VSL em demo.localhost/vsl: timer com prazo real e VSL com CTA aos 3 s.
export function demoVslDocument(): QuizDocument {
  const base = demoDocument();
  return QuizDocument.parse({
    ...base,
    offers: [
      {
        id: "offer_demo",
        provider: "hotmart",
        productId: "DEMO123",
        fullPriceUrl: "https://pay.hotmart.com/DEMO123?checkoutMode=10",
        promo: { url: "https://pay.hotmart.com/DEMO123?off=promo", expiresAt: "2099-01-01T00:00:00Z" },
      },
    ],
    steps: [
      {
        id: "timer",
        type: "offerTimer",
        name: "Prazo",
        offerId: "offer_demo",
        title: "Sua condição especial termina em",
        expiredText: "A condição especial terminou.",
        ctaLabel: "Quero aproveitar",
      },
      {
        id: "vsl_main",
        type: "vsl",
        name: "VSL",
        headline: "Assista antes que saia do ar",
        video: { kind: "video", libraryId: "demo", videoId: "demo-video" },
        cta: { label: "Quero garantir minha vaga", showAt: 3, offerId: "offer_demo" },
        toast: { enabled: true, leadSeconds: 2, windowHours: 48 },
      },
    ],
  });
}

// Demo da página só VSL em espanhol (demo.localhost/vsl-es), com o texto do Pequeños Exploradores.
export function demoVslOnlyDocument(): QuizDocument {
  const base = demoVslDocument();
  return QuizDocument.parse({
    ...base,
    theme: {
      colors: { primary: "#7FA650", background: "#FFF9F2", surface: "#F6EDE2", text: "#4A2C1A", accent: "#D9603B" },
      font: "poppins",
      radius: 14,
    },
    settings: { ...base.settings, mode: "vsl" },
    steps: [
      {
        id: "vsl_es",
        type: "vsl",
        name: "VSL Pequeños Exploradores",
        banner: "🎥 Video gratuito · míralo hasta el final",
        headline: "Las 3 etapas para que tu bebé aprenda a comer de todo, sin miedo y sin peleas",
        subheadline: "Mira este video antes de la próxima comida de tu bebé.",
        aspect: "9:16",
        cta: { label: "Quiero Pequeños Exploradores", showAt: 3, offerId: "offer_demo" },
        toast: { enabled: false, leadSeconds: 0, windowHours: 48 },
      },
    ],
  });
}
