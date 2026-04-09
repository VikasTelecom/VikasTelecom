import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "user";
  status?: "active" | "blocked";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<User>;
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token || user) return;

    api.fetchMe()
      .then((data) => {
        const currentUser = data.user as User;
        setUser(currentUser);
        localStorage.setItem("auth_user", JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      });
  }, [user]);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    const u: User = data.user as User;
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    localStorage.setItem("auth_token", data.token);
    toast({ title: u.role === "admin" ? "Welcome, Admin!" : "Welcome back!", description: "You've logged in successfully." });
    return u;
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await api.loginWithGoogle(credential);
    const u: User = data.user as User;
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    localStorage.setItem("auth_token", data.token);
    toast({ title: u.role === "admin" ? "Welcome, Admin!" : "Welcome!", description: "Signed in with Google successfully." });
    return u;
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const data = await api.register(name, email, password, phone);
    const u: User = data.user as User;
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    localStorage.setItem("auth_token", data.token);
    toast({ title: "Account created!", description: "Welcome to Vikash Telecom." });
    return u;
  };

  const updateProfile = async (payload: { name?: string; phone?: string }) => {
    const data = await api.updateMe(payload);
    const u: User = data.user as User;
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    toast({ title: "Logged out", description: "See you soon!" });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
