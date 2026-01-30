import React from "react";

export interface ListProps {
  children: React.ReactNode;
  variant?: "ordered" | "unordered";
  className?: string;
}

export interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

export const List: React.FC<ListProps> = ({
  children,
  variant = "unordered",
  className = "",
}) => {
  const ListComponent = variant === "ordered" ? "ol" : "ul";

  return (
    <ListComponent
      className={`
        ${variant === "ordered" ? "list-decimal" : "list-disc"}
        space-y-2 pl-6 text-slate-700 leading-relaxed
        ${className}
      `}
    >
      {children}
    </ListComponent>
  );
};

export const ListItem: React.FC<ListItemProps> = ({
  children,
  className = "",
}) => {
  return <li className={className}>{children}</li>;
};
