import React from "react";
import { ButtonGhost, ButtonPrimary } from "@components/ui/Button";
import { useAuthModal } from "@hooks/useAuthModal";
import { useAuth } from "@context/AuthContext";
import { useNavigate, Link } from "@tanstack/react-router";
import { ProfileModal } from "@components/profile/ProfileModal";

const isDebugMode = import.meta.env.DEV;

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
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const openProfileModal = () => setIsProfileOpen(true);
  const closeProfileModal = () => setIsProfileOpen(false);

  return (
    <header className="relative z-50 bg-white/95 border-b border-slate-200 shadow-sm">
      <div className="container-max">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient">FairShare</h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {isDebugMode && (
              <Link
                to="/styleguide"
                className="hidden md:inline-flex text-slate-600 hover:text-accent-600 transition-colors duration-200 font-medium"
              >
                Styleguide
              </Link>
            )}

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {authUser ? (
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={openProfileModal}
                    className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-full transition-colors duration-200 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
                    aria-label="Edit profile"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {authUser.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {authUser.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={openProfileModal}
                    className="sm:hidden w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
                    aria-label="Edit profile"
                  >
                    <span className="text-white text-sm font-bold">
                      {authUser.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </button>
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
      {authUser && (
        <ProfileModal isOpen={isProfileOpen} onClose={closeProfileModal} />
      )}
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
    <header className="relative z-50 bg-white/95 border-b border-slate-200 shadow-sm">
      <div className="container-max">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => navigate({ to: "/" })}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-600 rounded-lg flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient">FairShare</h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {isDebugMode && (
              <Link
                to="/styleguide"
                className="hidden md:inline-flex text-slate-600 hover:text-accent-600 transition-colors duration-200 font-medium"
              >
                Styleguide
              </Link>
            )}
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
