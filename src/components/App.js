import React, { useCallback, useState } from 'react'
import '../assets/app.css'
import PackageViewer from './PackageViewer';
import openxml from 'openxml'
import { open } from '@tauri-apps/api/dialog';
import { readBinaryFile } from '@tauri-apps/api/fs';
import { Button, Modal } from 'antd';

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
        console.log('pkg', pkg);
        setPackage(pkg);
        setVisibility(false);
      })
    }, (reason) => {
      console.error('reason', reason);
    })
  }, []);

  return (
    <div className="App">
      { pkg ? <PackageViewer pkg={pkg} /> : null }
      <Modal
        visible={visibility}
        centerd
        title="Palantir Foundry"
        footer={
          <Button onClick={openDialog}>Open</Button>
        }
      >
        <div>
          <p>Please choose some office document.</p>
        </div>
      </Modal>
    </div>
  )
}

export default App
