export type SupportAudience = "all" | "customer" | "chef";

export type SupportFaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  audience?: SupportAudience;
};

export type SupportFaqMatch = {
  best: SupportFaqEntry | null;
  alternatives: SupportFaqEntry[];
  score: number;
};

export const SUPPORT_FAQ: SupportFaqEntry[] = [
  {
    id: "book-chef",
    question: "How do I book a chef?",
    answer:
      "Go to the home page, choose a chef profile, and continue to checkout. Submit your booking request and you will receive status updates in-app.",
    keywords: ["book", "booking", "reserve", "chef", "checkout"],
    audience: "customer",
  },
  {
    id: "pricing-fees",
    question: "How much does it cost?",
    answer:
      "Pricing varies by chef, service type, and menu. You can compare starting prices on profiles and review full pricing at checkout before confirming.",
    keywords: ["cost", "price", "pricing", "fee", "fees", "how much"],
    audience: "customer",
  },
  {
    id: "cancel-refund",
    question: "What is the cancellation and refund policy?",
    answer:
      "Cancellation windows vary by chef and are shown on each profile. If you cancel within the allowed window you can receive a refund based on the listing policy.",
    keywords: ["cancel", "cancellation", "refund", "reschedule", "policy"],
    audience: "customer",
  },
  {
    id: "dietary",
    question: "Can chefs support dietary restrictions?",
    answer:
      "Many chefs support dietary preferences such as vegan, gluten-free, and other needs. Use filters and profile details to find the best match.",
    keywords: ["diet", "dietary", "allergy", "vegan", "gluten", "restriction"],
    audience: "customer",
  },
  {
    id: "chef-onboarding",
    question: "How do I join as a chef?",
    answer:
      "Open the chef onboarding page, complete your profile, service areas, and compliance details, then submit for review.",
    keywords: ["chef", "join", "onboarding", "become chef", "apply"],
    audience: "chef",
  },
  {
    id: "payment-issues",
    question: "I have a payment issue. What should I do?",
    answer:
      "First confirm your payment method details and try checkout again. If the problem continues, contact support with your email and booking details so we can investigate quickly.",
    keywords: ["payment", "card", "charge", "failed", "billing"],
    audience: "customer",
  },
  {
    id: "notifications",
    question: "Where can I see booking updates?",
    answer:
      "Booking updates appear in the notification bell when you are signed in. You can mark individual notifications as read or clear all.",
    keywords: ["notification", "updates", "status", "bell", "read"],
    audience: "all",
  },
];

const TERM_ALIASES: Record<string, string[]> = {
  cost: ["price", "pricing", "fee", "fees", "charge"],
  booking: ["book", "reserve", "reservation"],
  cancel: ["cancellation", "refund", "reschedule"],
  chef: ["cook", "provider"],
  onboarding: ["apply", "join", "signup"],
  payment: ["billing", "card", "charged"],
  help: ["support", "assist", "contact"],
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string) {
  return normalize(text).split(" ").filter((t) => t.length >= 2);
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function expandTerms(terms: string[]) {
  const expanded = new Set<string>(terms);
  for (const term of terms) {
    const aliases = TERM_ALIASES[term] ?? [];
    for (const alias of aliases) expanded.add(alias);
  }
  return Array.from(expanded);
}

function scoreKeyword(queryTerms: string[], keyword: string) {
  const key = normalize(keyword);
  if (!key) return 0;

  let score = 0;
  for (const term of queryTerms) {
    if (term === key) {
      score = Math.max(score, 5);
      continue;
    }
    if (key.includes(term) || term.includes(key)) {
      score = Math.max(score, 3);
      continue;
    }
    if (term.length >= 4 && key.length >= 4 && levenshtein(term, key) <= 1) {
      score = Math.max(score, 2);
    }
  }

  return score;
}

function filterByAudience(entries: SupportFaqEntry[], audience: SupportAudience) {
  if (audience === "all") return entries;
  return entries.filter((entry) => !entry.audience || entry.audience === "all" || entry.audience === audience);
}

export function getQuickTopics(audience: SupportAudience, limit = 6) {
  return filterByAudience(SUPPORT_FAQ, audience).slice(0, limit);
}

export function findBestFaqMatch(input: string, audience: SupportAudience = "all"): SupportFaqMatch {
  const terms = tokenize(input);
  if (terms.length === 0) {
    return { best: null, alternatives: filterByAudience(SUPPORT_FAQ, audience).slice(0, 3), score: 0 };
  }

  const expandedTerms = expandTerms(terms);
  const candidates = filterByAudience(SUPPORT_FAQ, audience);

  const ranked = candidates
    .map((entry) => {
      const question = normalize(entry.question);
      let score = 0;

      for (const keyword of entry.keywords) {
        score += scoreKeyword(expandedTerms, keyword);
      }

      for (const term of expandedTerms) {
        if (question.includes(term)) score += 1;
      }

      return { entry, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const alternatives = ranked
    .slice(0, 3)
    .filter((item) => item.score > 0)
    .map((item) => item.entry);

  if (!best || best.score < 4) {
    return {
      best: null,
      alternatives: alternatives.length ? alternatives : candidates.slice(0, 3),
      score: best?.score ?? 0,
    };
  }

  return {
    best: best.entry,
    alternatives: ranked.slice(1, 4).filter((item) => item.score > 0).map((item) => item.entry),
    score: best.score,
  };
}
