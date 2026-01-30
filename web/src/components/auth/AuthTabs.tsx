import React from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Tabs, TabItem } from "@components/ui/Tabs";

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
          <LoginForm onSuccess={onSuccess} />
        </div>
      </TabItem>
      <TabItem label="Create Account" value="register">
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed">
            Join FairShare to start splitting expenses with friends, family, and
            roommates.
          </p>
          <RegisterForm onSuccess={onSuccess} />
        </div>
      </TabItem>
    </Tabs>
  );
};
