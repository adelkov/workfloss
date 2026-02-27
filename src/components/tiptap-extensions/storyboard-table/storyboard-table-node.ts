import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { StoryboardTableView } from "./storyboard-table-view";

export const StoryboardTableNode = Node.create({
  name: "storyboardTable",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      scenes: {
        default: "[]",
        parseHTML: (element) => element.getAttribute("data-scenes") || "[]",
        renderHTML: (attributes) => ({
          "data-scenes": attributes.scenes as string,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="storyboard-table"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "storyboard-table" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StoryboardTableView);
  },
});
