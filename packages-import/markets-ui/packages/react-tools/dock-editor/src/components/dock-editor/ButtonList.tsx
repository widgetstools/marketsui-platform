import { DynamicIcon as Icon } from "@markets/icons-svg/react";
import type {
  DockButtonConfig,
  DockMenuItemConfig,
} from "@markets/openfin-workspace";
import { Button } from "../ui/button";
import { ButtonRow } from "./ButtonRow";

interface ButtonListProps {
  buttons: DockButtonConfig[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAdd: () => void;
  onAddMenuItem: (
    buttonId: string,
    item: DockMenuItemConfig,
    parentItemId?: string,
  ) => void;
  onUpdateMenuItem: (
    buttonId: string,
    itemId: string,
    item: DockMenuItemConfig,
    parentItemId?: string,
  ) => void;
  onRemoveMenuItem: (
    buttonId: string,
    itemId: string,
    parentItemId?: string,
  ) => void;
  onReorderMenuItems: (
    buttonId: string,
    fromIndex: number,
    toIndex: number,
    parentItemId?: string,
  ) => void;
}

export function ButtonList({
  buttons,
  onEdit,
  onRemove,
  onReorder,
  onAdd,
  onAddMenuItem,
  onUpdateMenuItem,
  onRemoveMenuItem,
  onReorderMenuItems,
}: ButtonListProps) {
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      {buttons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Icon
            icon="lucide:layout-grid"
            className="h-10 w-10 mb-3 opacity-30"
          />
          <p className="text-sm font-medium">No dock buttons</p>
          <p className="text-xs opacity-60 mt-1">
            Add buttons to customize the dock
          </p>
        </div>
      )}

      {buttons.map((button, index) => (
        <ButtonRow
          key={button.id}
          button={button}
          index={index}
          total={buttons.length}
          onEdit={() => onEdit(button.id)}
          onRemove={() => {
            if (window.confirm(`Delete "${button.tooltip}"?`)) {
              onRemove(button.id);
            }
          }}
          onMoveUp={() => {
            if (index > 0) onReorder(index, index - 1);
          }}
          onMoveDown={() => {
            if (index < buttons.length - 1) onReorder(index, index + 1);
          }}
          onAddMenuItem={(item, parentItemId) =>
            onAddMenuItem(button.id, item, parentItemId)
          }
          onUpdateMenuItem={(itemId, item, parentItemId) =>
            onUpdateMenuItem(button.id, itemId, item, parentItemId)
          }
          onRemoveMenuItem={(itemId, parentItemId) =>
            onRemoveMenuItem(button.id, itemId, parentItemId)
          }
          onReorderMenuItems={(fromIndex, toIndex, parentItemId) =>
            onReorderMenuItems(button.id, fromIndex, toIndex, parentItemId)
          }
        />
      ))}

      <Button
        variant="outline"
        className="w-full h-9 border-dashed border-border hover:border-foreground/30 hover:bg-accent/50 text-xs"
        onClick={onAdd}
      >
        <Icon icon="lucide:plus" className="h-3.5 w-3.5 mr-1.5" />
        Add Button
      </Button>
    </div>
  );
}
