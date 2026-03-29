"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { iconToSVG, iconToHTML, getIconData } from "@iconify/utils";
import type { IconifyJSON } from "@iconify/types";
import { TRADING_ICONS, svgToDataUrl } from "@markets/openfin-workspace";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import { cn } from "../lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

interface IconPickerProps {
  onSelect: (iconName: string, svgDataUrl: string) => void;
  selectedIcon?: string;
  /** Color for the SVG data URL (default "#ffffff" for dark theme) */
  color?: string;
}

interface IconEntry {
  name: string;
  displayName: string;
  source: "iconify" | "trading";
  svg?: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const COLLECTIONS = [
  { id: "all", label: "All" },
  { id: "trading", label: "Trading" },
  { id: "lucide", label: "Lucide" },
  { id: "mdi", label: "Material" },
  { id: "tabler", label: "Tabler" },
  { id: "ph", label: "Phosphor" },
] as const;

const MAX_VISIBLE = 200;
const SEARCH_DEBOUNCE_MS = 300;
const ICONIFY_API = "https://api.iconify.design";

// ─── Trading icons (local, always available) ─────────────────────────

const tradingIconEntries: IconEntry[] = Object.entries(TRADING_ICONS).map(
  ([key, icon]) => ({
    name: key,
    displayName: icon.name,
    source: "trading" as const,
    svg: icon.svg,
  }),
);

// ─── Iconify API helpers ─────────────────────────────────────────────

async function searchIcons(
  query: string,
  prefix?: string,
): Promise<IconEntry[]> {
  const params = new URLSearchParams({ query, limit: String(MAX_VISIBLE) });
  if (prefix && prefix !== "all") {
    params.set("prefix", prefix);
  }
  const res = await fetch(`${ICONIFY_API}/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  const icons: string[] = data.icons ?? [];
  return icons.map((id) => ({
    name: id,
    displayName: id.split(":")[1]?.replace(/-/g, " ") ?? id,
    source: "iconify" as const,
  }));
}

async function loadCollectionSample(prefix: string): Promise<IconEntry[]> {
  const res = await fetch(`${ICONIFY_API}/collection?prefix=${prefix}`);
  if (!res.ok) return [];
  const data = await res.json();
  const names: string[] = [];
  if (data.uncategorized) names.push(...data.uncategorized);
  if (data.categories) {
    for (const cat of Object.values(data.categories) as string[][]) {
      names.push(...cat);
    }
  }
  return names.slice(0, MAX_VISIBLE).map((name) => ({
    name: `${prefix}:${name}`,
    displayName: name.replace(/-/g, " "),
    source: "iconify" as const,
  }));
}

async function getIconSvg(iconId: string): Promise<string | null> {
  const [prefix, name] = iconId.split(":");
  if (!prefix || !name) return null;
  const res = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
  if (!res.ok) return null;
  const data: IconifyJSON = await res.json();
  const iconData = getIconData(data, name);
  if (!iconData) return null;
  const renderData = iconToSVG(iconData, { height: 24 });
  return iconToHTML(renderData.body, renderData.attributes);
}

// ─── Component ───────────────────────────────────────────────────────

export function IconPicker({
  onSelect,
  selectedIcon,
  color = "#ffffff",
}: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [apiIcons, setApiIcons] = useState<IconEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    timerRef.current = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timerRef.current);
  }, [search]);

  // Fetch icons when search or category changes
  useEffect(() => {
    if (category === "trading") {
      setApiIcons([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchIcons = async () => {
      setLoading(true);
      setError(null);
      try {
        let results: IconEntry[];
        if (debouncedSearch) {
          results = await searchIcons(
            debouncedSearch,
            category !== "all" ? category : undefined,
          );
        } else if (category !== "all") {
          results = await loadCollectionSample(category);
        } else {
          results = [];
        }
        if (!controller.signal.aborted) setApiIcons(results);
      } catch {
        if (!controller.signal.aborted) {
          setError("Could not reach Iconify API");
          setApiIcons([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchIcons();
    return () => controller.abort();
  }, [debouncedSearch, category]);

  // Combine visible icons
  const visibleIcons = useMemo(() => {
    if (category === "trading") {
      const q = debouncedSearch.toLowerCase();
      return q
        ? tradingIconEntries.filter((i) =>
            i.displayName.toLowerCase().includes(q),
          )
        : tradingIconEntries;
    }
    if (category === "all" && !debouncedSearch) {
      return tradingIconEntries;
    }
    return apiIcons;
  }, [category, debouncedSearch, apiIcons]);

  const handleSelect = useCallback(
    async (icon: IconEntry) => {
      let svgString: string | null;
      if (icon.source === "trading" && icon.svg) {
        svgString = icon.svg;
      } else {
        svgString = await getIconSvg(icon.name);
      }
      if (svgString) {
        const dataUrl = svgToDataUrl(svgString, color);
        onSelect(icon.name, dataUrl);
      }
    },
    [color, onSelect],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <Icon
            icon="lucide:search"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50"
          />
          <Input
            placeholder="Search 200K+ icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs pl-7"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {COLLECTIONS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setCategory(col.id)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                category === col.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-foreground",
              )}
            >
              {col.label}
            </button>
          ))}
        </div>

        {/* Icon grid */}
        <ScrollArea className="h-[200px] rounded-md border border-border p-1.5">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Icon
                icon="lucide:loader-2"
                className="h-5 w-5 animate-spin text-muted-foreground"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive text-center mt-8">
              {error}
            </p>
          )}

          {!loading && !error && visibleIcons.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
                gap: "4px",
              }}
            >
              {visibleIcons.map((icon) => (
                <Tooltip key={`${icon.source}-${icon.name}`}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleSelect(icon)}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded hover:bg-accent",
                        selectedIcon === icon.name &&
                          "ring-2 ring-primary bg-accent",
                      )}
                    >
                      <IconRenderer icon={icon} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[10px] px-2 py-1"
                  >
                    {icon.displayName}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {!loading && !error && visibleIcons.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Icon
                icon="lucide:search"
                className="h-5 w-5 mb-2 opacity-30"
              />
              <p className="text-xs">
                {category === "all" && !debouncedSearch
                  ? "Type to search 200K+ icons"
                  : `No icons found for "${debouncedSearch}"`}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

// ─── Icon Renderer ───────────────────────────────────────────────────

function IconRenderer({ icon }: { icon: IconEntry }) {
  if (icon.source === "trading" && icon.svg) {
    return (
      <div
        className="w-5 h-5 text-foreground"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        dangerouslySetInnerHTML={{ __html: icon.svg }}
      />
    );
  }
  return <Icon icon={icon.name} width={18} className="text-foreground" />;
}
