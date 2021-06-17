import React, { useCallback, useState } from 'react'
import '../assets/app.css'
import PackageViewer from './PackageViewer';
import openxml from 'openxml'
import { open } from '@tauri-apps/api/dialog';
import { readBinaryFile } from '@tauri-apps/api/fs';
import { Button, Layout} from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';

import 'antd/dist/antd.css'

function App() {
  const [visibility, setVisibility] = useState(true);
  const [pkg, setPackage] = useState(null);

  const openDialog = useCallback(() => {
    open({
      defaultPath: '/home/gaopeng',
      directory: false,
      filters: [{name: 'Office Files', extensions: ['docx']}],
      multiple: false,
    }).then((filename) => {
      readBinaryFile(filename).then((fileResult) => {
        const pkg = new openxml.OpenXmlPackage(fileResult)
        setVisibility(false);
        setPackage(pkg);
      })
    }, (reason) => {
      console.error('reason', reason);
    })
  }, []);

  return (
    <div className="app">
      { pkg ? <PackageViewer pkg={pkg} /> : null }
      <Layout className="operation-card" style={{display: visibility ? 'flex' : 'none'}}>
        {/*<Layout.Sider width="50%" theme="light">*/}
        {/*  <Button type="primary" onClick={openDialog} icon={<CloudUploadOutlined />}>Open</Button>*/}
        {/*</Layout.Sider>*/}
        <Layout.Content>
          <Button type="primary" size="large" onClick={openDialog} icon={<CloudUploadOutlined />}>Open</Button>
        </Layout.Content>
      </Layout>
    </div>
  )
}

export default App
