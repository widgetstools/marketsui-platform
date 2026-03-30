import { useState } from "react";
import { DynamicIcon as Icon } from "@markets/icons-svg/react";
import type {
  DockButtonConfig,
  DockDropdownButtonConfig,
  DockMenuItemConfig,
} from "@markets/openfin-workspace";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { MenuItemList } from "./MenuItemList";

interface ButtonRowProps {
  button: DockButtonConfig;
  index: number;
  total: number;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddMenuItem: (item: DockMenuItemConfig, parentItemId?: string) => void;
  onUpdateMenuItem: (
    itemId: string,
    item: DockMenuItemConfig,
    parentItemId?: string,
  ) => void;
  onRemoveMenuItem: (itemId: string, parentItemId?: string) => void;
  onReorderMenuItems: (
    fromIndex: number,
    toIndex: number,
    parentItemId?: string,
  ) => void;
}

export function ButtonRow({
  button,
  index,
  total,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddMenuItem,
  onUpdateMenuItem,
  onRemoveMenuItem,
  onReorderMenuItems,
}: ButtonRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isDropdown = button.type === "DropdownButton";
  const dropdownButton = isDropdown
    ? (button as DockDropdownButtonConfig)
    : null;
  const itemCount = dropdownButton?.options?.length ?? 0;

  return (
    <div className="flex flex-col">
      {/* Main row */}
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-card",
          "hover:bg-accent/40 hover:border-accent/60",
        )}
      >
        {/* Chevron toggle for dropdowns */}
        {isDropdown ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded"
          >
            <Icon
              icon={expanded ? "lucide:chevron-down" : "lucide:chevron-right"}
              className="h-3.5 w-3.5"
            />
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Icon preview */}
        <div className="shrink-0 w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center border border-border/50">
          {button.iconUrl ? (
            <img src={button.iconUrl} alt="" className="w-5 h-5" />
          ) : (
            <Icon
              icon="lucide:image"
              className="w-4 h-4 text-muted-foreground/30"
            />
          )}
        </div>

        {/* Tooltip text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{button.tooltip}</p>
        </div>

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="text-[10px] font-normal px-1.5 py-0 shrink-0"
        >
          {isDropdown ? "Dropdown" : "Action"}
        </Badge>

        {/* Item count for dropdowns */}
        {isDropdown && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        )}

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            <Icon icon="lucide:chevron-up" className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
          >
            <Icon icon="lucide:chevron-down" className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onEdit}
            title="Edit"
          >
            <Icon icon="lucide:pencil" className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
            title="Delete"
          >
            <Icon icon="lucide:trash-2" className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded children for DropdownButton */}
      {isDropdown && expanded && dropdownButton && (
        <div className="ml-5 mt-1 pl-3 border-l-2 border-muted">
          <MenuItemList
            items={dropdownButton.options ?? []}
            onAdd={(item) => onAddMenuItem(item)}
            onUpdate={(itemId, item) => onUpdateMenuItem(itemId, item)}
            onRemove={(itemId) => onRemoveMenuItem(itemId)}
            onReorder={(from, to) => onReorderMenuItems(from, to)}
            onAddNested={(item, parentId) => onAddMenuItem(item, parentId)}
            onUpdateNested={(itemId, item, parentId) =>
              onUpdateMenuItem(itemId, item, parentId)
            }
            onRemoveNested={(itemId, parentId) =>
              onRemoveMenuItem(itemId, parentId)
            }
            onReorderNested={(from, to, parentId) =>
              onReorderMenuItems(from, to, parentId)
            }
            level={0}
          />
        </div>
      )}
    </div>
  );
}
