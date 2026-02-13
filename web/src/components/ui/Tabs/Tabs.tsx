import React, { useState, useCallback, useId } from "react";

export interface TabsProps {
  children: React.ReactNode;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
}

export interface TabItemProps {
  label: string;
  value: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultTab,
  activeTab,
  onTabChange,
  className = "",
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || "");
  const baseId = useId();

  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabItemProps> =>
      React.isValidElement(child) && child.type === TabItem,
  );

  const activeTabValue =
    (activeTab ?? internalActiveTab) || tabs[0]?.props.value || "";

  const setActiveTabValue = useCallback(
    (value: string) => {
      if (activeTab === undefined) {
        setInternalActiveTab(value);
      }
      onTabChange?.(value);
    },
    [activeTab, onTabChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      let newIndex = index;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          newIndex = index + 1;
          if (newIndex >= tabs.length) newIndex = 0;
          break;
        case "ArrowLeft":
          event.preventDefault();
          newIndex = index - 1;
          if (newIndex < 0) newIndex = tabs.length - 1;
          break;
        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;
        case "End":
          event.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const newTab = tabs[newIndex];
      if (newTab) {
        setActiveTabValue(newTab.props.value);
        // Focus the new tab button
        const tabButton = document.getElementById(
          `${baseId}-tab-${newTab.props.value}`,
        );
        tabButton?.focus();
      }
    },
    [tabs, baseId, setActiveTabValue],
  );

  return (
    <div className={className}>
      <div className="border-b border-primary-200">
        <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.props.value}
              id={`${baseId}-tab-${tab.props.value}`}
              onClick={() => setActiveTabValue(tab.props.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={activeTabValue === tab.props.value}
              aria-controls={`${baseId}-panel-${tab.props.value}`}
              tabIndex={activeTabValue === tab.props.value ? 0 : -1}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 cursor-pointer
                ${
                  activeTabValue === tab.props.value
                    ? "border-accent-500 text-accent-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }
              `}
            >
              {tab.props.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6">
        {tabs.map(
          (tab) =>
            tab.props.value === activeTabValue && (
              <div
                key={tab.props.value}
                id={`${baseId}-panel-${tab.props.value}`}
                role="tabpanel"
                aria-labelledby={`${baseId}-tab-${tab.props.value}`}
                className="block"
              >
                {tab.props.children}
              </div>
            ),
        )}
      </div>
    </div>
  );
};

export const TabItem: React.FC<TabItemProps> = ({ children }) => {
  return <>{children}</>;
};
