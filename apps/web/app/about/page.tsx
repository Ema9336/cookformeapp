import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Cook For Me",
  description: "Learn about Cook For Me and our mission.",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <Link href="/" className="text-green-600 hover:underline text-xs mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">About Cook For Me</h1>
      <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
        Cook For Me helps people book trusted local chefs for home-cooked meals, weekly meal prep, and small events.
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Our Mission</h2>
          <p>
            Make quality, personalized food more accessible by connecting customers with independent chefs in their
            area.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What We Offer</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chef discovery by location and cuisine</li>
            <li>Simple booking and order tracking</li>
            <li>Dietary and budget-friendly search filters</li>
            <li>Chef tools for onboarding, profiles, and earnings</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">For Customers and Chefs</h2>
          <p>
            Customers can find the right chef for everyday meals or special occasions. Chefs can grow their business
            with better visibility, booking management, and analytics.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contact</h2>
          <p>
            Questions or feedback? Reach out at{" "}
            <a href="mailto:support@cookforme.com" className="text-green-600 hover:underline">
              support@cookforme.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
