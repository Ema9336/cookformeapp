export type SupportFaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export const SUPPORT_FAQ: SupportFaqEntry[] = [
  {
    id: "book-chef",
    question: "How do I book a chef?",
    answer:
      "Go to the home page, choose a chef profile, and continue to checkout. Submit your booking request and you will receive status updates in-app.",
    keywords: ["book", "booking", "reserve", "chef", "checkout"],
  },
  {
    id: "pricing-fees",
    question: "How much does it cost?",
    answer:
      "Pricing varies by chef, service type, and menu. You can compare starting prices on profiles and review full pricing at checkout before confirming.",
    keywords: ["cost", "price", "pricing", "fee", "fees", "how much"],
  },
  {
    id: "cancel-refund",
    question: "What is the cancellation and refund policy?",
    answer:
      "Cancellation windows vary by chef and are shown on each profile. If you cancel within the allowed window you can receive a refund based on the listing policy.",
    keywords: ["cancel", "cancellation", "refund", "reschedule", "policy"],
  },
  {
    id: "dietary",
    question: "Can chefs support dietary restrictions?",
    answer:
      "Many chefs support dietary preferences such as vegan, gluten-free, and other needs. Use filters and profile details to find the best match.",
    keywords: ["diet", "dietary", "allergy", "vegan", "gluten", "restriction"],
  },
  {
    id: "chef-onboarding",
    question: "How do I join as a chef?",
    answer:
      "Open the chef onboarding page, complete your profile, service areas, and compliance details, then submit for review.",
    keywords: ["chef", "join", "onboarding", "become chef", "apply"],
  },
  {
    id: "payment-issues",
    question: "I have a payment issue. What should I do?",
    answer:
      "First confirm your payment method details and try checkout again. If the problem continues, contact support with your email and booking details so we can investigate quickly.",
    keywords: ["payment", "card", "charge", "failed", "billing"],
  },
  {
    id: "notifications",
    question: "Where can I see booking updates?",
    answer:
      "Booking updates appear in the notification bell when you are signed in. You can mark individual notifications as read or clear all.",
    keywords: ["notification", "updates", "status", "bell", "read"],
  },
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function findBestFaqAnswer(input: string): SupportFaqEntry | null {
  const query = normalize(input);
  if (!query) return null;

  const terms = new Set(query.split(" ").filter((term) => term.length >= 2));

  let best: SupportFaqEntry | null = null;
  let bestScore = 0;

  for (const entry of SUPPORT_FAQ) {
    const question = normalize(entry.question);
    let score = 0;

    for (const keyword of entry.keywords) {
      const key = normalize(keyword);
      if (query.includes(key)) score += 4;
    }

    for (const term of terms) {
      if (question.includes(term)) score += 1;
    }

    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return bestScore >= 3 ? best : null;
}
