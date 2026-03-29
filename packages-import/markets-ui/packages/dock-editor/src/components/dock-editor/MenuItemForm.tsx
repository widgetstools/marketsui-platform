import { useState, useEffect } from "react";
import type { DockMenuItemConfig } from "@markets/openfin-workspace";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { IconPicker } from "../IconPicker";
import { ActionIdSelect } from "./ActionIdSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: DockMenuItemConfig;
  onSave: (item: DockMenuItemConfig) => void;
}

export function MenuItemForm({
  open,
  onOpenChange,
  item,
  onSave,
}: MenuItemFormProps) {
  const [tooltip, setTooltip] = useState(item?.tooltip ?? "");
  const [iconUrl, setIconUrl] = useState(item?.iconUrl ?? "");
  const [actionId, setActionId] = useState(item?.actionId ?? "launch-app");
  const [selectedIconName, setSelectedIconName] = useState("");
  const [hasChildren, setHasChildren] = useState(
    !!(item?.options && item.options.length > 0),
  );

  const isEditing = !!item;

  // Reset form when item changes
  useEffect(() => {
    if (open) {
      setTooltip(item?.tooltip ?? "");
      setIconUrl(item?.iconUrl ?? "");
      setActionId(item?.actionId ?? "launch-app");
      setSelectedIconName("");
      setHasChildren(!!(item?.options && item.options.length > 0));
    }
  }, [open, item]);

  const handleSave = () => {
    const newItem: DockMenuItemConfig = {
      id: item?.id ?? `menu-${Date.now()}`,
      tooltip: tooltip || "New Item",
      iconUrl: iconUrl || undefined,
      actionId,
      options: hasChildren ? item?.options ?? [] : undefined,
    };
    onSave(newItem);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEditing ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* Tooltip */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tooltip</Label>
            <Input
              value={tooltip}
              onChange={(e) => setTooltip(e.target.value)}
              placeholder="Menu item label..."
              className="h-8 text-xs"
            />
          </div>

          {/* Action ID */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Action ID</Label>
            <ActionIdSelect value={actionId} onChange={setActionId} />
          </div>

          {/* Has Children toggle */}
          <div className="flex items-center justify-between py-1">
            <Label className="text-xs text-muted-foreground">
              Has sub-items
            </Label>
            <Switch checked={hasChildren} onCheckedChange={setHasChildren} />
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Icon</Label>
            {iconUrl && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-muted/50 border border-border">
                <div className="w-7 h-7 rounded bg-background flex items-center justify-center border border-border">
                  <img src={iconUrl} alt="" className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  {selectedIconName || "Custom icon"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-1.5 ml-auto"
                  onClick={() => {
                    setIconUrl("");
                    setSelectedIconName("");
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
            <IconPicker
              selectedIcon={selectedIconName}
              onSelect={(name, dataUrl) => {
                setSelectedIconName(name);
                setIconUrl(dataUrl);
              }}
            />
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={handleSave}>
            {isEditing ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
