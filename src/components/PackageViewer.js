import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from 'prop-types';
import { EditorView, highlightSpecialChars, highlightActiveLine, drawSelection, keymap } from "@codemirror/view"
import { EditorState, Prec } from "@codemirror/state"
import { xml } from '@codemirror/lang-xml';
import { lineNumbers } from '@codemirror/gutter';
import { defaultKeymap } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { oneDark } from "@codemirror/theme-one-dark";
import openxml from 'openxml'

import '../assets/package-viewer.css'
import { Tree, Layout } from "antd";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { formatXMLBeautify } from "../utils";

const { Sider, Content } = Layout;

function getTreeData(pkg) {
  const data = [];
  Object.entries(pkg.parts).forEach(([id, part]) => {
    const pathItems =  id.split('/').filter(Boolean);
    const topLevelId = pathItems[0];
    let index = data.findIndex((part) => part.key === topLevelId);
    let parentPart = data[index];
    if (!parentPart) {
      parentPart = {
        key: topLevelId,
        title: topLevelId,
        children: [],
      };
      data.push(parentPart)
    }
    if (pathItems.length > 1) {
      parentPart.children.push({
        key: id,
        title: id,
        children: [],
        disabled: pkg.parts[id].partType !== 'xml',
      })
    }
  })

  return data;
}

const basicSetup = [
  lineNumbers(),
  highlightSpecialChars(),
  foldGutter(),
  drawSelection(),
  drawSelection(),
  Prec.fallback(defaultHighlightStyle),
  rectangularSelection(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...defaultKeymap,
    ...searchKeymap,
    ...foldKeymap,
  ])
]


function createEditorState(data) {
  const value = openxml.util.decode_utf8(data);
  return EditorState.create({
    doc: formatXMLBeautify(value),
    extensions: [basicSetup, xml(), oneDark]
  });
}

function PackageViewer({ pkg }) {
  const parts = getTreeData(pkg);

  const [currentUri, setCurrentUri] = useState(null);
  const editorView = useRef(null);

  useEffect(() => {
    if (currentUri) {
      const part = pkg.parts[currentUri];

      const editorContainer = document.querySelector('#editor');
      const fileContent = part.data;
      if (!editorView.current) {
        const state = createEditorState(fileContent);
        const view = new EditorView({ state, parent: editorContainer })
        editorView.current = view;
      } else {
        editorView.current.setState(createEditorState(fileContent));
      }

    }
  }, [currentUri])

  const handleSelect = useCallback((keys) => {
    const partUri = keys[0];

    setCurrentUri(partUri);
  }, [])

  return (
    <Layout className="package-viewer">
      <Sider id="package-tree" width="350" theme="light">
        <Tree
          defaultExpandAll
          treeData={parts}
          onSelect={handleSelect}
        />
      </Sider>
      <Content id="editor"></Content>
    </Layout>
  )
}

PackageViewer.propTypes = {
  pkg: PropTypes.object,
}

export default PackageViewer
