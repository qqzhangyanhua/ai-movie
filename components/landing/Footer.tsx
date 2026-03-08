import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "关于我们" },
  { href: "/privacy", label: "隐私政策" },
  { href: "/terms", label: "使用条款" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-sm text-slate-500">AI 微电影 © 2026</p>
        <nav className="flex gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
