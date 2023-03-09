import { Image, Xml } from "@vicons/carbon";
import { h } from "vue";
import { NIcon } from "naive-ui";

class Tree {
  constructor() {
    this.root = {
      children: [],
    };
  }

  insertLeaf(leaf) {
    const segments = leaf.key.split("/").filter(Boolean);
    const parentSegments = segments.slice(0, -1);
    let parent = this.root;
    for (let i = 0; i < parentSegments.length; i++) {
      const key = parentSegments.slice(0, i + 1).join("/");
      let treeNode = parent.children.find((i) => i.key === key);
      if (!treeNode) {
        treeNode = {
          key: key,
          label: parentSegments[i],
          children: [],
        };
        parent.children.push(treeNode);
      }
      parent = treeNode;
    }

    parent.children.push(leaf);
  }

  static parseLeafNode(part) {
    const isBinary = part.partType === "binary";
    return {
      key: part.uri,
      label: part.uri,
      children: [],
      isLeaf: true,
      prefix() {
        const icon = isBinary ? Image : Xml;
        return h(NIcon, null, { default: () => h(icon) });
      },
    };
  }
}

function createTree(docPackage) {
  if (!docPackage) {
    return [];
  }

  const tree = new Tree();
  Object.values(docPackage.parts).forEach((part) => {
    const leaf = Tree.parseLeafNode(part);
    tree.insertLeaf(leaf);
  });

  return tree.root.children;
}

export { createTree };
