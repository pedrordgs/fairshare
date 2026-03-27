import React from "react";

const GitHubLink: React.FC = () => (
  <a
    href="https://github.com/pedrordgs/fairshare/"
    target="_blank"
    rel="noreferrer"
    aria-label="FairShare on GitHub"
    className="inline-flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
  >
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38c.6.11.82-.26.82-.58c0-.29-.01-1.04-.02-2.05c-3.34.73-4.04-1.61-4.04-1.61c-.55-1.39-1.33-1.76-1.33-1.76c-1.09-.74.08-.73.08-.73c1.2.08 1.84 1.24 1.84 1.24c1.08 1.84 2.82 1.31 3.5 1c.11-.78.42-1.31.76-1.61c-2.67-.3-5.47-1.34-5.47-5.93c0-1.31.47-2.38 1.24-3.22c-.12-.3-.54-1.52.12-3.18c0 0 1.01-.32 3.3 1.23c.96-.27 1.98-.4 3-.4c1.02 0 2.04.14 3 .4c2.29-1.55 3.3-1.23 3.3-1.23c.66 1.66.24 2.88.12 3.18c.77.84 1.24 1.91 1.24 3.22c0 4.6-2.81 5.62-5.49 5.92c.43.37.82 1.1.82 2.22c0 1.61-.01 2.9-.01 3.3c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  </a>
);

/**
 * Simple footer without auth CTA - for pages where auth is not relevant
 *
 * @example
 * ```tsx
 * <FooterSimple />
 * ```
 */
export const FooterSimple: React.FC = () => {
  return (
    <footer className="relative bg-white border-t border-slate-200 py-6">
      <div className="px-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
        <p>© 2026 FairShare. Built with care for fair expense splitting.</p>
        <GitHubLink />
      </div>
    </footer>
  );
};

/**
 * Footer with auth CTA - encourages users to sign up
 *
 * @example
 * ```tsx
 * <FooterWithAuth />
 * ```
 */
export const FooterWithAuth: React.FC = () => {
  return (
    <footer className="relative bg-white border-t border-slate-200 py-6">
      <div className="px-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500">
        <p>© 2026 FairShare. Built with care for fair expense splitting.</p>
        <GitHubLink />
      </div>
    </footer>
  );
};

/**
 * @deprecated Use FooterSimple or FooterWithAuth instead
 * Legacy Footer component with showAuth boolean prop
 */
export interface FooterProps {
  showAuth?: boolean;
}

/**
 * @deprecated Use FooterSimple or FooterWithAuth instead
 * Legacy Footer component for backwards compatibility
 */
export const Footer: React.FC<FooterProps> = ({ showAuth = true }) => {
  if (showAuth) {
    return <FooterWithAuth />;
  }
  return <FooterSimple />;
};
