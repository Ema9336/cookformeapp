import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Cook For Me. All rights reserved.</p>
        <nav className="flex flex-wrap gap-4 justify-center">
          <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition">
            About
          </Link>
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition">
            Privacy &amp; Cookies
          </Link>
          <a href="mailto:support@cookforme.com" className="hover:text-gray-900 dark:hover:text-white transition">
            Contact Us
          </a>
        </nav>
      </div>
    </footer>
  );
}
