import React, { createContext, useContext, useEffect, useState } from 'react';

export const DEFAULT_ADMIN_USERNAME = 'samson';
export const DEFAULT_ADMIN_PASSWORD = 'sam2026';
export const ADMIN_EMAIL = 'samsontsegayef@gmail.com';

export interface AuthUser {
  username: string;
  displayName: string;
  email: string;
  role: string;
  canEdit: boolean;
  isEditor: boolean;
  avatarLetter: string;
  loginTime: string;
}

interface AuthContextType {
  user: AuthUser | null;
  idToken: string | null;
  loading: boolean;
  adminPassword: string;
  signInWithCredentials: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signInAsViewer: () => void;
  signOut: () => void;
  resetPasswordToDefault: () => { success: boolean; message: string; defaultPassword: string };
  updateAdminPassword: (newPassword: string) => { success: boolean; message: string };
  isAuthenticated: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null,
  loading: true,
  adminPassword: DEFAULT_ADMIN_PASSWORD,
  signInWithCredentials: async () => ({ success: false }),
  signInAsViewer: () => {},
  signOut: () => {},
  resetPasswordToDefault: () => ({ success: true, message: '', defaultPassword: DEFAULT_ADMIN_PASSWORD }),
  updateAdminPassword: () => ({ success: false, message: '' }),
  isAuthenticated: false,
  canEdit: false,
});

const AUTH_STORAGE_KEY = 'wb_pmo_auth_session';
const ADMIN_PASSWORD_STORAGE_KEY = 'wb_pmo_admin_password';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      const storedPass = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
      return storedPass && storedPass.trim() ? storedPass.trim() : DEFAULT_ADMIN_PASSWORD;
    } catch {
      return DEFAULT_ADMIN_PASSWORD;
    }
  });

  // Load existing session from storage on start
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.username) {
          setUser(parsed);
        }
      } else {
        // By default on initial load, auto-authenticate as SteerCo Viewer so the dashboard is immediately accessible,
        // while edits strictly require Samson's credentials (username: samson, password: sam2026)
        const defaultViewer: AuthUser = {
          username: 'guest_viewer',
          displayName: 'Executive SteerCo Viewer',
          email: 'steerco.viewer@wholesalebank.internal',
          role: 'SteerCo Stakeholder (Read-Only)',
          canEdit: false,
          isEditor: false,
          avatarLetter: 'V',
          loginTime: new Date().toISOString(),
        };
        setUser(defaultViewer);
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultViewer));
      }
    } catch (e) {
      console.warn('Auth session recovery error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPasswordToDefault = () => {
    try {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, DEFAULT_ADMIN_PASSWORD);
      setAdminPassword(DEFAULT_ADMIN_PASSWORD);
      return {
        success: true,
        message: `Password has been reset to default: ${DEFAULT_ADMIN_PASSWORD}`,
        defaultPassword: DEFAULT_ADMIN_PASSWORD,
      };
    } catch (err: any) {
      setAdminPassword(DEFAULT_ADMIN_PASSWORD);
      return {
        success: true,
        message: `Password has been reset in active memory: ${DEFAULT_ADMIN_PASSWORD}`,
        defaultPassword: DEFAULT_ADMIN_PASSWORD,
      };
    }
  };

  const updateAdminPassword = (newPassword: string) => {
    const clean = newPassword.trim();
    if (!clean || clean.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }
    try {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, clean);
      setAdminPassword(clean);
      return { success: true, message: 'Password successfully updated.' };
    } catch (e: any) {
      setAdminPassword(clean);
      return { success: true, message: 'Password updated for current session.' };
    }
  };

  const signInWithCredentials = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Verify allowed Editor credentials: username "samson" and active admin password (or default failsafe)
    const validPassword = adminPassword || DEFAULT_ADMIN_PASSWORD;
    if (cleanUser === 'samson' && (cleanPass === validPassword || cleanPass === DEFAULT_ADMIN_PASSWORD)) {
      const editorUser: AuthUser = {
        username: 'samson',
        displayName: 'Samson (Lead PMO Admin)',
        email: 'samson.pmo@wholesalebank.internal',
        role: 'Lead PMO Director & Editor',
        canEdit: true,
        isEditor: true,
        avatarLetter: 'S',
        loginTime: new Date().toISOString(),
      };
      setUser(editorUser);
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(editorUser));
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Invalid credentials. Please enter authorized administrator credentials.' 
    };
  };

  const signInAsViewer = () => {
    const viewerUser: AuthUser = {
      username: 'guest_viewer',
      displayName: 'Executive SteerCo Viewer',
      email: 'steerco.viewer@wholesalebank.internal',
      role: 'SteerCo Stakeholder (Read-Only)',
      canEdit: false,
      isEditor: false,
      avatarLetter: 'V',
      loginTime: new Date().toISOString(),
    };
    setUser(viewerUser);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(viewerUser));
  };

  const signOut = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    // Reset to Viewer mode or clear
    const viewerUser: AuthUser = {
      username: 'guest_viewer',
      displayName: 'Executive SteerCo Viewer',
      email: 'steerco.viewer@wholesalebank.internal',
      role: 'SteerCo Stakeholder (Read-Only)',
      canEdit: false,
      isEditor: false,
      avatarLetter: 'V',
      loginTime: new Date().toISOString(),
    };
    setUser(viewerUser);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(viewerUser));
  };

  const isAuthenticated = !!user;
  const canEdit = user?.canEdit === true;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        idToken: user?.isEditor ? 'editor-samson-token' : null, 
        loading, 
        signInWithCredentials, 
        signInAsViewer, 
        signOut,
        isAuthenticated,
        canEdit
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
