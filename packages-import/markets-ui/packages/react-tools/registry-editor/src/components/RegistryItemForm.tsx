import { useState, useEffect } from "react";
import { DynamicIcon as Icon } from "@markets/icons-svg/react";
import { ICON_NAMES, ICON_META } from "@markets/icons-svg";
import { generateTemplateConfigId } from "@markets/openfin-workspace";

export interface RegistryFormData {
  displayName: string;
  framework: "react" | "angular";
  hostUrl: string;
  iconId: string;
  componentType: string;
  componentSubType: string;
  isTemplate: boolean;
}

interface RegistryItemFormProps {
  open: boolean;
  title: string;
  initial?: Partial<RegistryFormData>;
  onSave: (data: RegistryFormData) => void;
  onCancel: () => void;
}

const FRAMEWORK_OPTIONS = [
  { label: "React", value: "react" as const },
  { label: "Angular", value: "angular" as const },
];

export function RegistryItemForm({ open, title, initial, onSave, onCancel }: RegistryItemFormProps) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [framework, setFramework] = useState<"react" | "angular">(initial?.framework ?? "react");
  const [hostUrl, setHostUrl] = useState(initial?.hostUrl ?? "");
  const [iconId, setIconId] = useState(initial?.iconId ?? "lucide:box");
  const [componentType, setComponentType] = useState(initial?.componentType ?? "");
  const [componentSubType, setComponentSubType] = useState(initial?.componentSubType ?? "");
  const [isTemplate, setIsTemplate] = useState(initial?.isTemplate ?? true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setDisplayName(initial?.displayName ?? "");
      setFramework(initial?.framework ?? "react");
      setHostUrl(initial?.hostUrl ?? "");
      setIconId(initial?.iconId ?? "lucide:box");
      setComponentType(initial?.componentType ?? "");
      setComponentSubType(initial?.componentSubType ?? "");
      setIsTemplate(initial?.isTemplate ?? true);
      setErrors({});
      setIconPickerOpen(false);
      setIconSearch("");
    }
  }, [open, initial]);

  if (!open) return null;

  const filteredIcons = ICON_NAMES.filter((name) => {
    if (!iconSearch) return true;
    const meta = ICON_META[name];
    return name.includes(iconSearch.toLowerCase()) || meta?.category.includes(iconSearch.toLowerCase());
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = "Required";
    if (!hostUrl.trim()) newErrors.hostUrl = "Required";
    if (!componentType.trim()) newErrors.componentType = "Required";
    if (!componentSubType.trim()) newErrors.componentSubType = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ displayName, framework, hostUrl, iconId, componentType: componentType.toUpperCase(), componentSubType: componentSubType.toUpperCase(), isTemplate });
  }

  const generatedId = isTemplate ? generateTemplateConfigId(componentType.toUpperCase(), componentSubType.toUpperCase()) : null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onCancel} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 1000, animation: "de-fade-in 0.15s ease",
      }} />

      {/* Dialog */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 480, maxHeight: "85vh", overflow: "auto",
        background: "var(--de-bg-raised)", border: "1px solid var(--de-border)",
        borderRadius: "var(--de-radius-lg)", boxShadow: "var(--de-shadow-lg)",
        zIndex: 1001, animation: "de-scale-in 0.2s ease",
        padding: 24, display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--de-text)" }}>{title}</div>

        {/* Display Name */}
        <FieldGroup label="Display Name" error={errors.displayName}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., Credit Blotter" style={inputStyle} />
        </FieldGroup>

        {/* Framework */}
        <FieldGroup label="Framework">
          <div style={{ display: "flex", gap: 8 }}>
            {FRAMEWORK_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setFramework(opt.value)}
                style={{
                  ...chipStyle,
                  background: framework === opt.value ? "var(--de-accent-dim)" : "var(--de-bg-surface)",
                  color: framework === opt.value ? "var(--de-accent)" : "var(--de-text-secondary)",
                  borderColor: framework === opt.value ? "var(--de-accent)" : "var(--de-border)",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </FieldGroup>

        {/* Host URL */}
        <FieldGroup label="Host URL" error={errors.hostUrl}>
          <input value={hostUrl} onChange={(e) => setHostUrl(e.target.value)}
            placeholder="e.g., http://localhost:5174/views/credit-blotter" style={inputStyle} />
        </FieldGroup>

        {/* Icon */}
        <FieldGroup label="Icon">
          <button onClick={() => setIconPickerOpen(!iconPickerOpen)} style={{
            ...inputStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          }}>
            <Icon icon={iconId} style={{ width: 16, height: 16, color: "var(--de-accent)" }} />
            <span style={{ fontSize: 12, color: "var(--de-text-secondary)" }}>{iconId}</span>
          </button>
          {iconPickerOpen && (
            <div style={{
              marginTop: 6, padding: 8, background: "var(--de-bg-surface)",
              border: "1px solid var(--de-border)", borderRadius: "var(--de-radius-sm)",
              maxHeight: 200, overflow: "auto",
            }}>
              <input value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Search icons..." style={{ ...inputStyle, marginBottom: 8, fontSize: 11 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 32px)", gap: 4 }}>
                {filteredIcons.slice(0, 80).map((name) => (
                  <button key={name} title={name}
                    onClick={() => { setIconId(`mkt:${name}`); setIconPickerOpen(false); }}
                    style={{
                      width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                      background: iconId === `mkt:${name}` ? "var(--de-accent-dim)" : "transparent",
                      border: "1px solid transparent", borderRadius: 4, cursor: "pointer",
                      color: "var(--de-text-secondary)",
                    }}>
                    <Icon icon={`mkt:${name}`} style={{ width: 16, height: 16 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </FieldGroup>

        {/* Component Type + SubType */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldGroup label="Component Type" error={errors.componentType}>
            <input value={componentType} onChange={(e) => setComponentType(e.target.value)}
              placeholder="e.g., GRID" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Component SubType" error={errors.componentSubType}>
            <input value={componentSubType} onChange={(e) => setComponentSubType(e.target.value)}
              placeholder="e.g., CREDIT" style={inputStyle} />
          </FieldGroup>
        </div>

        {/* Template toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--de-text)" }}>Template Component</div>
            <div style={{ fontSize: 11, color: "var(--de-text-tertiary)" }}>
              Creates a template config in APP_CONFIG
            </div>
          </div>
          <button onClick={() => setIsTemplate(!isTemplate)} style={{
            width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
            background: isTemplate ? "var(--de-accent)" : "var(--de-bg-active)",
            position: "relative", transition: "background 0.2s ease",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2,
              left: isTemplate ? 18 : 2, transition: "left 0.2s ease",
            }} />
          </button>
        </div>

        {/* Generated Config ID preview */}
        {isTemplate && componentType && componentSubType && (
          <div style={{
            padding: "8px 12px", background: "var(--de-bg-surface)",
            borderRadius: "var(--de-radius-sm)", border: "1px solid var(--de-border)",
          }}>
            <div style={{ fontSize: 10, color: "var(--de-text-tertiary)", marginBottom: 2 }}>
              Generated Config ID
            </div>
            <div style={{ fontSize: 12, fontFamily: "var(--de-mono)", color: "var(--de-accent)" }}>
              {generatedId}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} style={saveBtnStyle}>Save</button>
        </div>
      </div>
    </>
  );
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--de-text-secondary)", marginBottom: 4 }}>
        {label} {error && <span style={{ color: "var(--de-danger)", marginLeft: 4 }}>{error}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  background: "var(--de-bg-surface)", color: "var(--de-text)",
  border: "1px solid var(--de-border)", borderRadius: "var(--de-radius-sm)",
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const chipStyle: React.CSSProperties = {
  padding: "6px 14px", borderRadius: "var(--de-radius-sm)",
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  border: "1px solid var(--de-border)", background: "var(--de-bg-surface)",
  color: "var(--de-text-secondary)", transition: "all 0.15s ease",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px", borderRadius: "var(--de-radius-sm)",
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  border: "1px solid var(--de-border)", background: "var(--de-bg-surface)",
  color: "var(--de-text-secondary)",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "8px 20px", borderRadius: "var(--de-radius-sm)",
  fontSize: 12, fontWeight: 600, cursor: "pointer",
  border: "none", background: "var(--de-accent)",
  color: "#000",
};
