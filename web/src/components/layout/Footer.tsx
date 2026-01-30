import React from "react";
import { Button } from "@components/ui/Button";
import { useAuthModal } from "@hooks/useAuthModal";

export interface FooterProps {
  showAuth?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ showAuth = true }) => {
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
          {showAuth && (
            <Button
              size="sm"
              onClick={() => openAuthModal({ tab: "register" })}
              className="shadow-md hover:shadow-lg transform hover:-translate-y-px transition-all duration-200"
            >
              Get Started
            </Button>
          )}
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
