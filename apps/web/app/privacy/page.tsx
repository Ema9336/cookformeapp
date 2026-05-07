import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsPreferenceControls from "./preference-controls";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy | Cook For Me",
  description: "Learn how Cook For Me handles your data and uses cookies.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <Link href="/" className="text-green-600 hover:underline text-xs mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy & Cookie Policy</h1>
      <p className="text-xs text-gray-400 mb-10">Last updated: May 4, 2026</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Who We Are</h2>
          <p>
            Cook For Me ("we", "us", "our") operates the cookforme.com platform. This policy explains how we
            collect, use, and protect your personal data, and how we use cookies. Contact us at{" "}
            <a href="mailto:privacy@cookforme.com" className="text-green-600 hover:underline">
              privacy@cookforme.com
            </a>{" "}
            with any questions.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong className="text-gray-900 dark:text-white">Account data:</strong> name, email address,
              password (hashed), and role (customer or chef).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Profile data:</strong> chef bio, cuisine type,
              profile photo, service areas, and pricing.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Booking data:</strong> booking dates, service
              type, messages, and payment information (processed by Stripe — we never store full card details).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Location data:</strong> approximate location
              derived from your IP address for showing nearby chefs. We do not track GPS location without
              explicit permission.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Usage data:</strong> pages visited, features
              used, and interaction patterns — only if you consent to analytics (see Section 6).
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Communications:</strong> messages sent through
              the platform between chefs and customers.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide, operate, and improve the platform</li>
            <li>To process bookings and facilitate payments</li>
            <li>To send booking confirmations, updates, and service notifications</li>
            <li>To verify chef compliance and prevent fraud</li>
            <li>To respond to customer support requests</li>
            <li>To analyse usage trends and improve user experience (with consent)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Legal Basis for Processing</h2>
          <p>We process your data under the following legal bases:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-gray-900 dark:text-white">Contract:</strong> to fulfil bookings you make</li>
            <li><strong className="text-gray-900 dark:text-white">Legitimate interests:</strong> security, fraud prevention, service improvement</li>
            <li><strong className="text-gray-900 dark:text-white">Consent:</strong> analytics tracking and marketing emails</li>
            <li><strong className="text-gray-900 dark:text-white">Legal obligation:</strong> tax records, compliance audits</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Data Sharing</h2>
          <p>
            We do not sell your personal data. We share data only with:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>
              <strong className="text-gray-900 dark:text-white">Stripe:</strong> for secure payment processing.
              Stripe&apos;s privacy policy governs their use of your payment data.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Railway / Vercel:</strong> our infrastructure
              providers hosting the platform.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Chefs on the platform:</strong> your name and
              booking details are shared with the chef you book.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Law enforcement:</strong> if required by
              applicable law or valid legal process.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Cookies & Tracking</h2>

          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-1">Essential Cookies</h3>
          <p>
            These are required for the platform to function. They include your authentication session token and
            security tokens. You cannot opt out of these while using the Service.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-800">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Cookie</th>
                  <th className="text-left px-3 py-2 font-semibold">Purpose</th>
                  <th className="text-left px-3 py-2 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr><td className="px-3 py-2 font-mono">access_token</td><td className="px-3 py-2">Keeps you logged in</td><td className="px-3 py-2">1 hour</td></tr>
                <tr><td className="px-3 py-2 font-mono">refresh_token</td><td className="px-3 py-2">Silent re-authentication</td><td className="px-3 py-2">7 days</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-1">Analytics Cookies (Optional)</h3>
          <p>
            With your consent, we use first-party analytics to understand how the platform is used. We do{" "}
            <strong>not</strong> use Google Analytics or any third-party tracking pixels.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-800">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Storage key</th>
                  <th className="text-left px-3 py-2 font-semibold">Purpose</th>
                  <th className="text-left px-3 py-2 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr><td className="px-3 py-2 font-mono">analytics_consent</td><td className="px-3 py-2">Records your analytics preference</td><td className="px-3 py-2">Persistent</td></tr>
                <tr><td className="px-3 py-2 font-mono">analytics_events</td><td className="px-3 py-2">Queued event data sent to our server</td><td className="px-3 py-2">Session</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            You can change your analytics preference at any time using the controls below.
          </p>
          <AnalyticsPreferenceControls />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active, and for up to 3 years after
            closure for legal and tax compliance purposes. Booking records are retained for 7 years as required
            by US tax law. Analytics event data is retained for 2 years.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">8. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-gray-900 dark:text-white">Access:</strong> request a copy of the data we hold about you</li>
            <li><strong className="text-gray-900 dark:text-white">Correction:</strong> request correction of inaccurate data</li>
            <li><strong className="text-gray-900 dark:text-white">Deletion:</strong> request deletion of your account and data</li>
            <li><strong className="text-gray-900 dark:text-white">Portability:</strong> receive your data in a machine-readable format</li>
            <li><strong className="text-gray-900 dark:text-white">Opt-out:</strong> withdraw consent for analytics at any time</li>
            <li><strong className="text-gray-900 dark:text-white">CCPA (California):</strong> opt out of the sale of personal information (we do not sell data)</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@cookforme.com" className="text-green-600 hover:underline">
              privacy@cookforme.com
            </a>
            . We will respond within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">9. Security</h2>
          <p>
            We use industry-standard security measures including TLS encryption in transit, hashed passwords
            (bcrypt), JWT tokens with short expiry, and access-controlled infrastructure. No method of
            transmission over the internet is 100% secure; we cannot guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">10. Children</h2>
          <p>
            The Service is not directed at children under 18. We do not knowingly collect personal data from
            anyone under 18. If we become aware that a child under 18 has provided us personal data, we will
            delete it promptly.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this policy periodically. We will notify you by email or in-app notification before
            material changes take effect. The "Last updated" date at the top of this page reflects the most
            recent revision.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">12. Contact</h2>
          <p>
            For privacy inquiries, contact our privacy team at{" "}
            <a href="mailto:privacy@cookforme.com" className="text-green-600 hover:underline">
              privacy@cookforme.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
