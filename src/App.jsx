import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ConsentView from './pages/ConsentView';
import SignaturePortal from './pages/SignaturePortal';
import Documents from './pages/Documents';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/verify/:id" element={<SignaturePortal />} />
        <Route path="/audit/:id" element={<ConsentView />} />
        <Route path="/documents" element={<Documents />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
