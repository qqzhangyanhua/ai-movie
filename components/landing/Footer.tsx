import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "关于我们" },
  { href: "/privacy", label: "隐私政策" },
  { href: "/terms", label: "使用条款" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0A] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-sm text-gray-500">AI MOVIE © 2026</p>
        <nav className="flex gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
