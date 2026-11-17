import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { ScanWorkspacePage } from './pages/ScanWorkspacePage';
import { HistoryPage } from './pages/HistoryPage';
import { TextOutputPage } from './pages/TextOutputPage';
import { DocumentOutputPage } from './pages/DocumentOutputPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditProvider } from './context/AuditContext';
import { MascotProvider } from './context/MascotContext';

export default function App() {
  return (
    <AuditProvider>
      <MascotProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="scan" element={<ScanWorkspacePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="text-output" element={<TextOutputPage />} />
              <Route path="document-output" element={<DocumentOutputPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MascotProvider>
    </AuditProvider>
  );
}
