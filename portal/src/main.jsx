import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './global.css';
import { decathlonDigitalTheme } from './theme';
import Root from './App';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={decathlonDigitalTheme} locale={zhCN}>
      <AntApp>
        <Root />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
