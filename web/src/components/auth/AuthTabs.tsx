import React from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { GoogleButton } from "./GoogleButton";
import { Tabs, TabItem } from "@components/ui/Tabs";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const handleGoogleLogin = () => {
  window.location.href = `${API_BASE_URL}/auth/google/`;
};

export interface AuthTabsProps {
  onSuccess?: () => void;
  initialTab?: "login" | "register";
}

export const AuthTabs: React.FC<AuthTabsProps> = ({
  onSuccess,
  initialTab = "login",
}) => {
  return (
    <Tabs defaultTab={initialTab}>
      <TabItem label="Sign In" value="login">
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            Welcome back! Sign in to access your expense groups and track your
            shared expenses.
          </p>
          <div className="space-y-4">
            <GoogleButton variant="login" onClick={handleGoogleLogin} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>
            <LoginForm onSuccess={onSuccess} />
          </div>
        </div>
      </TabItem>
      <TabItem label="Create Account" value="register">
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            Join FairShare to start splitting expenses with friends, family, and
            roommates.
          </p>
          <div className="space-y-4">
            <GoogleButton variant="signup" onClick={handleGoogleLogin} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>
            <RegisterForm onSuccess={onSuccess} />
          </div>
        </div>
      </TabItem>
    </Tabs>
  );
};
