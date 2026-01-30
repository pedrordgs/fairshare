import React from "react";
import { Button } from "@components/ui/Button";
import { useAuthModal } from "@hooks/useAuthModal";
import { useAuth } from "@context/AuthContext";
import { useNavigate, Link } from "@tanstack/react-router";

export interface HeaderProps {
  showAuth?: boolean;
  user?: {
    name: string;
    email: string;
  };
}

export const Header: React.FC<HeaderProps> = ({ showAuth = true, user }) => {
  const { openAuthModal } = useAuthModal();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const currentUser = user || authUser;

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
            {showAuth && (
              <div className="flex items-center space-x-4">
                {currentUser ? (
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {currentUser.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="text-slate-700 font-medium">
                        Welcome, {currentUser.name}!
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="hidden sm:inline-flex"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      className="hidden sm:inline-flex"
                      onClick={() => openAuthModal()}
                    >
                      Log In
                    </Button>
                    <Button
                      onClick={() => openAuthModal({ tab: "register" })}
                      className="shadow-lg hover:shadow-xl transform hover:-translate-y-px transition-all duration-200"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
