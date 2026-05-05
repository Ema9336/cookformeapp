import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Cook For Me",
  description: "Read the Cook For Me Terms of Service.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <Link href="/" className="text-green-600 hover:underline text-xs mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
      <p className="text-xs text-gray-400 mb-10">Last updated: May 4, 2026</p>

      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Cook For Me platform ("Service"), you agree to be bound by these Terms of
            Service and our Privacy Policy. If you do not agree to these terms, you may not use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Description of Service</h2>
          <p>
            Cook For Me is a marketplace that connects customers with independent personal chefs for home-cooked
            meals, weekly meal prep, and catering services. We are not a food delivery service or restaurant. Chefs
            are independent contractors, not employees of Cook For Me.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. User Accounts</h2>
          <p>
            You must create an account to book services or list as a chef. You are responsible for maintaining the
            security of your account credentials and for all activity under your account. You must provide accurate
            and complete information when registering. You must be at least 18 years old to use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Bookings and Payments</h2>
          <p>
            When you book a chef, you enter into a direct service agreement with that chef. Cook For Me facilitates
            the booking and payment process. All prices are set by individual chefs and are displayed inclusive of
            applicable taxes where required. Payments are processed securely. Cook For Me charges a platform service
            fee on each booking, which is disclosed at checkout.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Cancellations and Refunds</h2>
          <p>
            Cancellation policies vary by chef and are displayed on each chef&apos;s profile. Customers who cancel
            within the permitted window will receive a full refund. Cancellations outside that window may be subject
            to a cancellation fee at the chef&apos;s discretion. Cook For Me&apos;s platform fee is non-refundable
            once a booking is confirmed.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Chef Responsibilities</h2>
          <p>
            Chefs are responsible for complying with all applicable local, state, and federal food safety laws and
            regulations, including obtaining required licenses and permits. Cook For Me does not guarantee that any
            chef holds a specific license. Customers should verify compliance requirements independently.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Use the platform for any unlawful purpose</li>
            <li>Misrepresent your identity or qualifications</li>
            <li>Post false, misleading, or fraudulent reviews</li>
            <li>Attempt to circumvent the platform to arrange off-platform transactions</li>
            <li>Scrape, harvest, or collect user data without consent</li>
            <li>Interfere with the security or integrity of the Service</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">8. Intellectual Property</h2>
          <p>
            All content on Cook For Me — including logos, text, graphics, and software — is owned by or licensed to
            Cook For Me and protected by intellectual property laws. You may not copy, reproduce, or distribute any
            content without prior written permission.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">9. Disclaimers</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. Cook For Me does not warrant the
            accuracy, completeness, or reliability of any chef listings, reviews, or content. We are not liable for
            the quality, safety, or legality of services provided by chefs.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Cook For Me shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use of the Service, even if advised of the
            possibility of such damages.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without regard to
            conflict of law provisions. Any disputes shall be resolved through binding arbitration in accordance
            with the American Arbitration Association rules.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">12. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify registered users by email or in-app
            notification at least 30 days before material changes take effect. Continued use of the Service after
            changes constitutes acceptance of the new Terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">13. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:legal@cookforme.com" className="text-green-600 hover:underline">
              legal@cookforme.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
