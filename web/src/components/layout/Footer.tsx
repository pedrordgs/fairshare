import React from "react";
import { ButtonPrimary } from "@components/ui/Button";
import { useAuthModal } from "@hooks/useAuthModal";

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
    <footer className="relative bg-white border-t border-slate-200 py-12">
      <div className="container-max">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <h3 className="text-lg font-bold text-gradient">FairShare</h3>
            </div>
            <p className="text-sm text-slate-600 max-w-sm text-center md:text-left">
              Fair expense splitting made simple.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} FairShare. Built with care for fair
            expense splitting.
          </p>
        </div>
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
  const { openAuthModal } = useAuthModal();

  return (
    <footer className="relative bg-white border-t border-slate-200 py-12">
      <div className="container-max">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <h3 className="text-lg font-bold text-gradient">FairShare</h3>
            </div>
            <p className="text-sm text-slate-600 max-w-sm text-center md:text-left">
              Fair expense splitting made simple.
            </p>
          </div>

          {/* Auth Section */}
          <ButtonPrimary
            size="sm"
            onClick={() => openAuthModal({ tab: "register" })}
            className="shadow-md hover:shadow-lg transform hover:-translate-y-px transition-all duration-200"
          >
            Get Started
          </ButtonPrimary>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} FairShare. Built with care for fair
            expense splitting.
          </p>
        </div>
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
