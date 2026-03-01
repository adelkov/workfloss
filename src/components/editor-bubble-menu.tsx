import { useState, useCallback } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Baseline,
  Highlighter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#6b7280" },
  { name: "Brown", value: "#92400e" },
  { name: "Orange", value: "#ea580c" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Green", value: "#16a34a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Pink", value: "#db2777" },
  { name: "Red", value: "#dc2626" },
];

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Purple", value: "#ddd6fe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Red", value: "#fecaca" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Gray", value: "#e5e7eb" },
];

type OpenPicker = null | "color" | "highlight";

function ColorPicker({
  colors,
  onSelect,
  onClear,
  activeColor,
}: {
  colors: { name: string; value: string }[];
  onSelect: (color: string) => void;
  onClear: () => void;
  activeColor: string | undefined;
}) {
  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-max rounded-lg border bg-popover p-2 shadow-md">
      <div className="flex flex-wrap gap-1" style={{ maxWidth: 5 * 28 + 4 * 4 }}>
        {colors.map((c) => (
          <button
            key={c.value || "default"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:ring-2 hover:ring-ring"
            style={{ backgroundColor: c.value || undefined }}
            data-active={activeColor === c.value || undefined}
            title={c.name}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(c.value);
            }}
          >
            {c.value === "" && (
              <Baseline className="size-3.5 text-foreground" />
            )}
            {activeColor === c.value && c.value !== "" && (
              <div className="size-2 rounded-full bg-white mix-blend-difference" />
            )}
          </button>
        ))}
      </div>
      <button
        className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        onMouseDown={(e) => {
          e.preventDefault();
          onClear();
        }}
      >
        <X className="size-3" />
        Clear
      </button>
    </div>
  );
}

export function EditorBubbleMenu() {
  const { editor } = useCurrentEditor();
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const togglePicker = useCallback(
    (picker: OpenPicker) => {
      setOpenPicker((prev) => (prev === picker ? null : picker));
    },
    [],
  );

  if (!editor) return null;

  const activeTextColor = editor.getAttributes("textStyle").color as
    | string
    | undefined;
  const activeHighlight = editor.getAttributes("highlight").color as
    | string
    | undefined;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e }) => {
        if (!e.isEditable) return false;
        if (e.state.selection.empty) {
          setOpenPicker(null);
          return false;
        }
        return true;
      }}
    >
      <div className="relative flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-md">
        {/* Typography marks */}
        <ToolbarButton
          active={editor.isActive("bold")}
          onAction={() => editor.chain().focus().toggleBold().run()}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onAction={() => editor.chain().focus().toggleItalic().run()}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          active={editor.isActive("underline")}
          onAction={() => editor.chain().focus().toggleUnderline().run()}
          icon={Underline}
          label="Underline"
        />
        <ToolbarButton
          active={editor.isActive("strike")}
          onAction={() => editor.chain().focus().toggleStrike().run()}
          icon={Strikethrough}
          label="Strikethrough"
        />
        <ToolbarButton
          active={editor.isActive("code")}
          onAction={() => editor.chain().focus().toggleCode().run()}
          icon={Code}
          label="Code"
        />

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* Headings */}
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onAction={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onAction={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onAction={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          icon={Heading3}
          label="Heading 3"
        />

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* Text color */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-xs"
            className={openPicker === "color" ? "bg-accent" : ""}
            onMouseDown={(e) => {
              e.preventDefault();
              togglePicker("color");
            }}
            title="Text color"
          >
            <Baseline
              className="size-3.5"
              style={{ color: activeTextColor || undefined }}
            />
            <span
              className="absolute bottom-0.5 left-1 right-1 h-0.5 rounded-full"
              style={{
                backgroundColor: activeTextColor || "currentColor",
              }}
            />
          </Button>
          {openPicker === "color" && (
            <ColorPicker
              colors={TEXT_COLORS}
              activeColor={activeTextColor}
              onSelect={(color) => {
                if (color) {
                  editor.chain().focus().setColor(color).run();
                } else {
                  editor.chain().focus().unsetColor().run();
                }
                setOpenPicker(null);
              }}
              onClear={() => {
                editor.chain().focus().unsetColor().run();
                setOpenPicker(null);
              }}
            />
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-xs"
            className={openPicker === "highlight" ? "bg-accent" : ""}
            onMouseDown={(e) => {
              e.preventDefault();
              togglePicker("highlight");
            }}
            title="Highlight"
          >
            <Highlighter
              className="size-3.5"
              style={{ color: activeHighlight || undefined }}
            />
          </Button>
          {openPicker === "highlight" && (
            <ColorPicker
              colors={HIGHLIGHT_COLORS}
              activeColor={activeHighlight}
              onSelect={(color) => {
                editor.chain().focus().toggleHighlight({ color }).run();
                setOpenPicker(null);
              }}
              onClear={() => {
                editor.chain().focus().unsetHighlight().run();
                setOpenPicker(null);
              }}
            />
          )}
        </div>
      </div>
    </BubbleMenu>
  );
}

function ToolbarButton({
  active,
  onAction,
  icon: Icon,
  label,
}: {
  active: boolean;
  onAction: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      data-active={active || undefined}
      className="data-active:bg-accent"
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onAction();
      }}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
