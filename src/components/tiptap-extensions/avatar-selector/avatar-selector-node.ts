import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AvatarSelectorView } from "./avatar-selector-view";

export const AvatarSelectorNode = Node.create({
  name: "avatarSelector",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      avatarId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-avatar-id"),
        renderHTML: (attributes) => {
          if (!attributes.avatarId) return {};
          return { "data-avatar-id": attributes.avatarId };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="avatar-selector"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "avatar-selector" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AvatarSelectorView);
  },
});
