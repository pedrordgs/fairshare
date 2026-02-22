import React from "react";
import {
  type BaseButtonProps,
  ButtonPrimary,
  ButtonSecondary,
  ButtonGhost,
} from "@components/ui/Button";
import { Badge, type BadgeProps } from "@components/ui/Badge";

export interface ButtonWithBadgeProps extends BaseButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  badgeCount?: number;
  badgeVariant?: BadgeProps["variant"];
  badgeSize?: BadgeProps["size"];
}

export const ButtonWithBadge: React.FC<ButtonWithBadgeProps> = ({
  variant = "primary",
  size = "md",
  badgeCount,
  badgeVariant = "warning",
  badgeSize = "sm",
  children,
  className = "",
  ...props
}) => {
  const ButtonComponent = {
    primary: ButtonPrimary,
    secondary: ButtonSecondary,
    ghost: ButtonGhost,
  }[variant];

  const showBadge = badgeCount !== undefined && badgeCount > 0;

  const ariaLabel = showBadge
    ? `${props["aria-label"] || String(children)} (${badgeCount})`
    : props["aria-label"];

  return (
    <div className={`relative inline-flex ${className}`}>
      <ButtonComponent size={size} {...props} aria-label={ariaLabel}>
        {children}
      </ButtonComponent>
      {showBadge && (
        <Badge
          size={badgeSize}
          variant={badgeVariant}
          className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px]"
        >
          {badgeCount}
        </Badge>
      )}
    </div>
  );
};
