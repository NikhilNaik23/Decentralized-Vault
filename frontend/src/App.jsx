import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DIDList from './pages/DIDList';
import CreateDID from './pages/CreateDID';
import DIDDetails from './pages/DIDDetails';
import CredentialList from './pages/CredentialList';
import AddCredential from './pages/AddCredential';
import CredentialDetails from './pages/CredentialDetails';
import Blockchain from './pages/Blockchain';
import Settings from './pages/Settings';
import PublicVerification from './pages/PublicVerification';
import DecentralizedStorage from './pages/DecentralizedStorage';
import StorageStats from './pages/StorageStats';
import OAuthAuthorize from './pages/OAuthAuthorize';
import PublicAppRegistration from './pages/PublicAppRegistration';
import ConnectedApps from './pages/ConnectedApps';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<PublicVerification />} />
          <Route path="/developers/register" element={<PublicAppRegistration />} />
          
          {/* OAuth Route (requires authentication) */}
          <Route
            path="/oauth/authorize"
            element={
              <ProtectedRoute>
                <OAuthAuthorize />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dids"
            element={
              <ProtectedRoute>
                <DIDList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dids/create"
            element={
              <ProtectedRoute>
                <CreateDID />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dids/:id"
            element={
              <ProtectedRoute>
                <DIDDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credentials"
            element={
              <ProtectedRoute>
                <CredentialList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credentials/add"
            element={
              <ProtectedRoute>
                <AddCredential />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credentials/ipfs"
            element={
              <ProtectedRoute>
                <DecentralizedStorage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credentials/:id"
            element={
              <ProtectedRoute>
                <CredentialDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storage/stats"
            element={
              <ProtectedRoute>
                <StorageStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blockchain"
            element={
              <ProtectedRoute>
                <Blockchain />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connected-apps"
            element={
              <ProtectedRoute>
                <ConnectedApps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
