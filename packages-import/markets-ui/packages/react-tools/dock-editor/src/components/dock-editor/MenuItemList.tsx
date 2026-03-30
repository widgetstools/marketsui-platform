import { useState } from "react";
import { DynamicIcon as Icon } from "@markets/icons-svg/react";
import type { DockMenuItemConfig } from "@markets/openfin-workspace";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { MenuItemForm } from "./MenuItemForm";

interface MenuItemListProps {
  items: DockMenuItemConfig[];
  onAdd: (item: DockMenuItemConfig) => void;
  onUpdate: (itemId: string, item: DockMenuItemConfig) => void;
  onRemove: (itemId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  /** For nested items — pass through to parent */
  onAddNested?: (item: DockMenuItemConfig, parentItemId: string) => void;
  onUpdateNested?: (
    itemId: string,
    item: DockMenuItemConfig,
    parentItemId: string,
  ) => void;
  onRemoveNested?: (itemId: string, parentItemId: string) => void;
  onReorderNested?: (
    fromIndex: number,
    toIndex: number,
    parentItemId: string,
  ) => void;
  level: number;
}

export function MenuItemList({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  onAddNested,
  onUpdateNested,
  onRemoveNested,
  onReorderNested,
  level,
}: MenuItemListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<DockMenuItemConfig | undefined>();
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {items.length === 0 && (
        <p className="text-[11px] text-muted-foreground/60 py-2 pl-1">
          No menu items
        </p>
      )}

      {items.map((item, index) => {
        const hasChildren = !!(item.options && item.options.length > 0);
        const isExpanded = expandedIds.has(item.id);

        return (
          <div key={item.id} className="flex flex-col">
            <div
              className={cn(
                "group flex items-center gap-1.5 px-2 py-1 rounded border border-transparent",
                "hover:bg-accent/30 hover:border-border",
              )}
            >
              {/* Expand toggle */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <Icon
                    icon={
                      isExpanded
                        ? "lucide:chevron-down"
                        : "lucide:chevron-right"
                    }
                    className="h-3 w-3"
                  />
                </button>
              ) : (
                <div className="w-4" />
              )}

              {/* Icon */}
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt=""
                  className="w-4 h-4 shrink-0 rounded-sm"
                />
              ) : (
                <div className="w-4 h-4 shrink-0 rounded-sm bg-muted/40 flex items-center justify-center">
                  <Icon
                    icon="lucide:minus"
                    className="w-2.5 h-2.5 text-muted-foreground/30"
                  />
                </div>
              )}

              {/* Label */}
              <span className="flex-1 text-xs truncate min-w-0">
                {item.tooltip}
              </span>

              {/* Action ID badge */}
              <Badge
                variant="outline"
                className="text-[9px] font-normal px-1 py-0 shrink-0 max-w-[100px] truncate"
              >
                {item.actionId}
              </Badge>

              {/* Action buttons — visible on hover */}
              <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => {
                    if (index > 0) onReorder(index, index - 1);
                  }}
                  disabled={index === 0}
                  title="Move up"
                >
                  <Icon icon="lucide:chevron-up" className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => {
                    if (index < items.length - 1) onReorder(index, index + 1);
                  }}
                  disabled={index === items.length - 1}
                  title="Move down"
                >
                  <Icon icon="lucide:chevron-down" className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setEditingItem(item)}
                  title="Edit"
                >
                  <Icon icon="lucide:pencil" className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete "${item.tooltip}"?`)) {
                      onRemove(item.id);
                    }
                  }}
                  title="Delete"
                >
                  <Icon icon="lucide:trash-2" className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>

            {/* Nested children */}
            {hasChildren && isExpanded && (
              <div
                className="ml-4 mt-0.5 pl-2 border-l-2 border-muted"
                style={{ marginLeft: `${16}px` }}
              >
                <MenuItemList
                  items={item.options!}
                  onAdd={(child) => onAddNested?.(child, item.id)}
                  onUpdate={(childId, child) =>
                    onUpdateNested?.(childId, child, item.id)
                  }
                  onRemove={(childId) => onRemoveNested?.(childId, item.id)}
                  onReorder={(from, to) =>
                    onReorderNested?.(from, to, item.id)
                  }
                  onAddNested={onAddNested}
                  onUpdateNested={onUpdateNested}
                  onRemoveNested={onRemoveNested}
                  onReorderNested={onReorderNested}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add menu item button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full border-dashed border text-[11px] h-6 mt-0.5"
        onClick={() => setShowAddForm(true)}
      >
        <Icon icon="lucide:plus" className="h-2.5 w-2.5 mr-1" />
        Add Menu Item
      </Button>

      {/* Add form dialog */}
      <MenuItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSave={(item) => {
          onAdd(item);
          setShowAddForm(false);
        }}
      />

      {/* Edit form dialog */}
      {editingItem && (
        <MenuItemForm
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(undefined);
          }}
          item={editingItem}
          onSave={(item) => {
            onUpdate(item.id, item);
            setEditingItem(undefined);
          }}
        />
      )}
    </div>
  );
}
