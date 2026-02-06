import React from "react";
import { ButtonGhost, ButtonPrimary } from "@components/ui/Button";
import { useAuthModal } from "@hooks/useAuthModal";
import { useAuth } from "@context/AuthContext";
import { useNavigate, Link } from "@tanstack/react-router";

/**
 * Header with full auth functionality - shows login/signup or user info
 *
 * @example
 * ```tsx
 * <HeaderWithAuth />
 * ```
 */
export const HeaderWithAuth: React.FC = () => {
  const { openAuthModal } = useAuthModal();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="relative z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="container-max">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient transition-all duration-300 group-hover:text-accent-600">
              FairShare
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Styleguide Link */}
            <Link
              to="/styleguide"
              className="hidden md:inline-flex text-slate-600 hover:text-accent-600 transition-colors duration-200 font-medium"
            >
              Styleguide
            </Link>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {authUser ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {authUser.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      Welcome, {authUser.name}!
                    </span>
                  </div>
                  <ButtonGhost
                    size="sm"
                    onClick={logout}
                    className="hidden sm:inline-flex"
                  >
                    Sign Out
                  </ButtonGhost>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <ButtonGhost
                    className="hidden sm:inline-flex"
                    onClick={() => openAuthModal()}
                  >
                    Log In
                  </ButtonGhost>
                  <ButtonPrimary
                    onClick={() => openAuthModal({ tab: "register" })}
                    className="shadow-lg hover:shadow-xl transform hover:-translate-y-px transition-all duration-200"
                  >
                    Sign Up
                  </ButtonPrimary>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Simple header without auth - just logo and navigation
 *
 * @example
 * ```tsx
 * <HeaderSimple />
 * ```
 */
export const HeaderSimple: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="relative z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="container-max">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient transition-all duration-300 group-hover:text-accent-600">
              FairShare
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Styleguide Link */}
            <Link
              to="/styleguide"
              className="hidden md:inline-flex text-slate-600 hover:text-accent-600 transition-colors duration-200 font-medium"
            >
              Styleguide
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * @deprecated Use HeaderWithAuth or HeaderSimple instead
 * Legacy Header component props
 */
export interface HeaderProps {
  showAuth?: boolean;
  user?: {
    name: string;
    email: string;
  };
}

/**
 * @deprecated Use HeaderWithAuth or HeaderSimple instead
 * Legacy Header component for backwards compatibility
 */
export const Header: React.FC<HeaderProps> = ({ showAuth = true }) => {
  if (showAuth) {
    return <HeaderWithAuth />;
  }
  return <HeaderSimple />;
};
