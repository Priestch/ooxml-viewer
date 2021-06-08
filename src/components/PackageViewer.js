import React from "react";
import PropTypes from 'prop-types';

import '../assets/package-viewer.css'
import { Tree, Layout } from "antd";

const { Sider, Content } = Layout;

function PackageViewer({ pkg }) {
  const parts = [];
  Object.entries(pkg.parts).forEach(([id, part]) => {
    const pathItems =  id.split('/').filter(Boolean);
    const topLevelId = pathItems[0];
    let index = parts.findIndex((part) => part.key === topLevelId);
    let parentPart = parts[index];
    if (!parentPart) {
      parentPart = {
        key: topLevelId,
        title: topLevelId,
        children: [],
      };
      parts.push(parentPart)
    }
    if (pathItems.length > 1) {
      parentPart.children.push({
        key: id,
        title: id,
        children: [],
      })
    }
  })

  console.log(parts);

  return (
    <Layout className="package-viewer">
      <Sider id="package-tree" width="350" theme="light">
        <Tree
          defaultExpandAll
          treeData={parts}
        />
      </Sider>
      <Content>File</Content>
    </Layout>
  )
}

PackageViewer.propTypes = {
  pkg: PropTypes.object,
}

export default PackageViewer
