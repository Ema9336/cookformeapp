"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackAnalyticsEvent } from "../lib/analytics";
import { findBestFaqAnswer, SUPPORT_FAQ } from "../lib/support-faq";

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  role: "bot",
  text: "Hi! I am the Cook For Me assistant. Ask a question or use a quick topic below.",
};

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const quickTopics = useMemo(() => SUPPORT_FAQ.slice(0, 6), []);

  const askQuestion = (question: string) => {
    const userMessage: ChatMessage = { role: "user", text: question };
    const match = findBestFaqAnswer(question);

    const botMessage: ChatMessage = match
      ? { role: "bot", text: match.answer }
      : {
          role: "bot",
          text:
            "I could not find a precise answer yet. Please use Contact Support below and include your booking email so we can help quickly.",
        };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setShowContact(!match);

    trackAnalyticsEvent({
      eventType: "CUSTOM",
      label: match ? "support_chat_answered" : "support_chat_unanswered",
      metadata: {
        question,
        matchedFaqId: match?.id,
      },
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    askQuestion(question);
  };

  const onQuickTopic = (question: string) => {
    if (!isOpen) setIsOpen(true);
    askQuestion(question);
  };

  const contactHref = `mailto:support@cookforme.com?subject=${encodeURIComponent("Cook For Me Support Request")}&body=${encodeURIComponent(
    `Name: ${contactName || ""}\nEmail: ${contactEmail || ""}\n\nIssue details:\n`
  )}`;

  return (
    <div className="fixed bottom-20 right-4 z-[70] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[min(92vw,360px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
            <p className="text-sm font-semibold">Customer Support</p>
            <p className="text-xs text-emerald-50">Free FAQ assistant</p>
          </div>

          <div className="p-3 max-h-72 overflow-y-auto space-y-2 bg-gray-50 dark:bg-zinc-900">
            {messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}`}
                className={`text-xs leading-relaxed px-3 py-2 rounded-xl w-fit max-w-[90%] ${
                  m.role === "user"
                    ? "ml-auto bg-green-600 text-white"
                    : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {quickTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onQuickTopic(topic.question)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-700 hover:border-green-500 transition"
                >
                  {topic.question}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about bookings, pricing, refunds..."
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
              />
              <button
                type="submit"
                className="text-xs px-3 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold"
              >
                Send
              </button>
            </form>

            {showContact && (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-2.5 space-y-2">
                <p className="text-[11px] text-amber-900 dark:text-amber-200">
                  Need a human? Share your details and open support email draft.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name"
                    className="text-xs px-2.5 py-2 rounded border border-amber-300/70 bg-white/80 dark:bg-zinc-900"
                  />
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Your email"
                    type="email"
                    className="text-xs px-2.5 py-2 rounded border border-amber-300/70 bg-white/80 dark:bg-zinc-900"
                  />
                </div>
                <a
                  href={contactHref}
                  className="inline-block text-xs px-3 py-2 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700"
                >
                  Contact Support
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-full px-4 py-3 bg-black text-white dark:bg-white dark:text-black text-sm font-semibold shadow-lg"
      >
        {isOpen ? "Close Support" : "Chat Support"}
      </button>
    </div>
  );
}
