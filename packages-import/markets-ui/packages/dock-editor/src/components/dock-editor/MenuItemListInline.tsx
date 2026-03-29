/**
 * MenuItemListInline — self-contained menu-item editor used inside ButtonForm.
 * Manages its own local state via an `onChange` callback (no dispatch to the hook).
 */
import { useState } from "react";
import { Icon } from "@iconify/react";
import type { DockMenuItemConfig } from "@markets/openfin-workspace";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { MenuItemForm } from "./MenuItemForm";

interface MenuItemListInlineProps {
  items: DockMenuItemConfig[];
  onChange: (items: DockMenuItemConfig[]) => void;
}

export function MenuItemListInline({
  items,
  onChange,
}: MenuItemListInlineProps) {
  const [editingItem, setEditingItem] = useState<DockMenuItemConfig | undefined>();
  const [showAddForm, setShowAddForm] = useState(false);

  const reorder = (from: number, to: number) => {
    const result = [...items];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    onChange(result);
  };

  return (
    <div className="flex flex-col gap-1">
      {items.length === 0 && (
        <p className="text-[11px] text-muted-foreground/60 py-2 pl-1">
          No menu items yet
        </p>
      )}

      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "group flex items-center gap-1.5 px-2 py-1 rounded border border-transparent",
            "hover:bg-accent/30 hover:border-border",
          )}
        >
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
          <span className="flex-1 text-xs truncate">{item.tooltip}</span>

          {/* Action ID badge */}
          <Badge
            variant="outline"
            className="text-[9px] font-normal px-1 py-0 shrink-0"
          >
            {item.actionId}
          </Badge>

          {/* Action buttons */}
          <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => {
                if (index > 0) reorder(index, index - 1);
              }}
              disabled={index === 0}
            >
              <Icon icon="lucide:chevron-up" className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => {
                if (index < items.length - 1) reorder(index, index + 1);
              }}
              disabled={index === items.length - 1}
            >
              <Icon icon="lucide:chevron-down" className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setEditingItem(item)}
            >
              <Icon icon="lucide:pencil" className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive hover:text-destructive"
              onClick={() => {
                if (window.confirm(`Delete "${item.tooltip}"?`)) {
                  onChange(items.filter((i) => i.id !== item.id));
                }
              }}
            >
              <Icon icon="lucide:trash-2" className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      ))}

      {/* Add button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full border-dashed border text-[11px] h-6 mt-0.5"
        onClick={() => setShowAddForm(true)}
      >
        <Icon icon="lucide:plus" className="h-2.5 w-2.5 mr-1" />
        Add Menu Item
      </Button>

      {/* Add dialog */}
      <MenuItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSave={(item) => {
          onChange([...items, item]);
          setShowAddForm(false);
        }}
      />

      {/* Edit dialog */}
      {editingItem && (
        <MenuItemForm
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(undefined);
          }}
          item={editingItem}
          onSave={(updated) => {
            onChange(items.map((i) => (i.id === updated.id ? updated : i)));
            setEditingItem(undefined);
          }}
        />
      )}
    </div>
  );
}
