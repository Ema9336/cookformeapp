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
        Cook For Me is a marketplace that helps customers find and book local chefs for home-cooked meals, weekly
        prep, and intimate events.
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Our Mission</h2>
          <p>
            We are building a more personal alternative to one-size-fits-all food delivery. Our goal is to make
            quality, personalized meals more accessible while helping independent chefs grow sustainable businesses.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How Cook For Me Works</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Browse chefs by city, cuisine, and dietary needs.
            </li>
            <li>
              Compare profiles, menus, response times, and pricing to find your fit.
            </li>
            <li>
              Book directly through the platform and track updates from request to completion.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What You Can Book</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Everyday home-cooked meals</li>
            <li>Weekly meal prep plans</li>
            <li>Small event and family-style catering</li>
            <li>Menus with dietary accommodations when offered by chefs</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Built for Customers and Chefs</h2>
          <p>
            Customers get an easy way to discover trusted culinary talent nearby. Chefs get tools for profile
            management, booking workflow, and earnings visibility, all in one place.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Trust, Privacy, and Transparency</h2>
          <p>
            We include clear booking status updates, consent controls for analytics, and straightforward policy pages.
            As the platform grows, we will continue improving safety, identity checks, and compliance workflows.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Get Started</h2>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/signup" className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition">
              Join as Customer
            </Link>
            <Link href="/chef-onboarding" className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:border-gray-500 transition">
              Become a Chef
            </Link>
          </div>
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
