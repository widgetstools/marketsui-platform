import { useState } from "react";
import { DynamicIcon as Icon } from "@markets/icons-svg/react";
import type {
  DockButtonConfig,
  DockDropdownButtonConfig,
  DockMenuItemConfig,
} from "@markets/openfin-workspace";
import { cn } from "../../lib/utils";

interface DockPreviewProps {
  buttons: DockButtonConfig[];
}

export function DockPreview({ buttons }: DockPreviewProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  if (buttons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Icon icon="lucide:eye-off" className="h-8 w-8 mb-3 opacity-30" />
        <p className="text-sm font-medium">Nothing to preview</p>
        <p className="text-xs opacity-60 mt-1">
          Add buttons in the Editor tab first
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-4">
      {/* Dock bar simulation */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-sm">
        {buttons.map((button) => {
          const isActive = activeDropdown === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => {
                if (button.type === "DropdownButton") {
                  setActiveDropdown(isActive ? null : button.id);
                }
              }}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-lg border",
                "hover:bg-accent/60 hover:border-accent",
                isActive
                  ? "bg-accent border-accent"
                  : "bg-muted/30 border-border/50",
              )}
              title={button.tooltip}
            >
              {button.iconUrl ? (
                <img src={button.iconUrl} alt="" className="w-5 h-5" />
              ) : (
                <Icon
                  icon="lucide:square"
                  className="w-5 h-5 text-muted-foreground/40"
                />
              )}
              {button.type === "DropdownButton" && (
                <Icon
                  icon="lucide:chevron-down"
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-muted-foreground"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Dropdown menu preview */}
      {activeDropdown && (
        <DropdownPreview
          button={
            buttons.find(
              (b) => b.id === activeDropdown,
            ) as DockDropdownButtonConfig
          }
        />
      )}

      {/* Info note */}
      <p className="text-[11px] text-muted-foreground/50 mt-2">
        Click a dropdown button to preview its menu
      </p>
    </div>
  );
}

function DropdownPreview({ button }: { button: DockDropdownButtonConfig }) {
  if (!button?.options?.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        No menu items
      </div>
    );
  }

  return (
    <div className="w-56 rounded-lg border border-border bg-card shadow-md overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border bg-muted/30">
        <p className="text-[11px] font-medium text-muted-foreground">
          {button.tooltip}
        </p>
      </div>
      <div className="py-1">
        {button.options.map((item) => (
          <MenuItemPreview key={item.id} item={item} depth={0} />
        ))}
      </div>
    </div>
  );
}

function MenuItemPreview({
  item,
  depth,
}: {
  item: DockMenuItemConfig;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = !!(item.options && item.options.length > 0);

  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent/40",
        )}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {item.iconUrl ? (
          <img src={item.iconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <div className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="flex-1 text-left truncate">{item.tooltip}</span>
        {hasChildren && (
          <Icon
            icon={expanded ? "lucide:chevron-down" : "lucide:chevron-right"}
            className="w-3 h-3 text-muted-foreground shrink-0"
          />
        )}
      </button>
      {hasChildren &&
        expanded &&
        item.options!.map((child) => (
          <MenuItemPreview key={child.id} item={child} depth={depth + 1} />
        ))}
    </div>
  );
}
