import { useState, useEffect } from "react";
import type {
  DockButtonConfig,
  DockActionButtonConfig,
  DockDropdownButtonConfig,
  DockMenuItemConfig,
} from "@markets/openfin-workspace";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { IconPicker } from "../IconPicker";
import { ActionIdSelect } from "./ActionIdSelect";
import { MenuItemListInline } from "./MenuItemListInline";

interface ButtonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  button?: DockButtonConfig;
  onSave: (button: DockButtonConfig) => void;
}

export function ButtonForm({
  open,
  onOpenChange,
  button,
  onSave,
}: ButtonFormProps) {
  const [type, setType] = useState<"ActionButton" | "DropdownButton">(
    button?.type ?? "ActionButton",
  );
  const [tooltip, setTooltip] = useState(button?.tooltip ?? "");
  const [iconUrl, setIconUrl] = useState(button?.iconUrl ?? "");
  const [selectedIconName, setSelectedIconName] = useState("");
  const [actionId, setActionId] = useState(
    button?.type === "ActionButton"
      ? (button as DockActionButtonConfig).actionId
      : "launch-app",
  );
  const [menuItems, setMenuItems] = useState<DockMenuItemConfig[]>(
    button?.type === "DropdownButton"
      ? (button as DockDropdownButtonConfig).options
      : [],
  );

  const isEditing = !!button;

  // Reset form when button prop changes
  useEffect(() => {
    if (open) {
      setType(button?.type ?? "ActionButton");
      setTooltip(button?.tooltip ?? "");
      setIconUrl(button?.iconUrl ?? "");
      setSelectedIconName("");
      setActionId(
        button?.type === "ActionButton"
          ? (button as DockActionButtonConfig).actionId
          : "launch-app",
      );
      setMenuItems(
        button?.type === "DropdownButton"
          ? (button as DockDropdownButtonConfig).options
          : [],
      );
    }
  }, [open, button]);

  const handleSave = () => {
    const id = button?.id ?? `btn-${Date.now()}`;

    let newButton: DockButtonConfig;
    if (type === "DropdownButton") {
      newButton = {
        type: "DropdownButton",
        id,
        tooltip: tooltip || "New Dropdown",
        iconUrl,
        options: menuItems,
      };
    } else {
      newButton = {
        type: "ActionButton",
        id,
        tooltip: tooltip || "New Button",
        iconUrl,
        actionId,
      };
    }

    onSave(newButton);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden" style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm">
            {isEditing ? "Edit Button" : "Add Button"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-0">
          {/* Button Type */}
          <fieldset className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as "ActionButton" | "DropdownButton")
              }
              disabled={isEditing}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ActionButton">Action Button</SelectItem>
                <SelectItem value="DropdownButton">
                  Dropdown Button
                </SelectItem>
              </SelectContent>
            </Select>
          </fieldset>

          {/* Tooltip */}
          <fieldset className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tooltip</Label>
            <Input
              value={tooltip}
              onChange={(e) => setTooltip(e.target.value)}
              placeholder="Button label..."
              className="h-8 text-xs"
            />
          </fieldset>

          {/* Action ID (for ActionButton only) */}
          {type === "ActionButton" && (
            <fieldset className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Action ID
              </Label>
              <ActionIdSelect value={actionId} onChange={setActionId} />
            </fieldset>
          )}

          {/* Icon */}
          <fieldset className="space-y-1.5">
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
          </fieldset>

          {/* Menu Items (for DropdownButton only) */}
          {type === "DropdownButton" && (
            <>
              <Separator />
              <fieldset className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Menu Items
                </Label>
                <MenuItemListInline
                  items={menuItems}
                  onChange={setMenuItems}
                />
              </fieldset>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t border-border">
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
