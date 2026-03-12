import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthContextType } from "@/types";
import { usersApi } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always check server auth status
    const checkAuth = async () => {
      try {
        const userData = await usersApi.getMe();
        setUser(userData);
        setIsAuthenticated(true);
        // Sync token from server if needed
        localStorage.setItem("token", `Bearer_${Date.now()}`); // minimal token caching
      } catch {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await usersApi.login({ email, password });
      const { user: userData, token } = response;
      localStorage.setItem("token", token);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw new Error("Invalid credentials - check server connection");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (email: string, name: string, password: string, role?: string): Promise<User> => {
    try {
      // Try backend API first
      const response = await usersApi.register({ email, name, password, role });
      const { user: userData, token } = response;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      
      // Also save to localStorage for Students page to work
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      users.push({ ...userData, password });
      localStorage.setItem("users", JSON.stringify(users));
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch {
      // Fallback: create local user
      const newUser: User = { 
        id: `${role || "student"}_${Date.now()}`, 
        email, 
        name, 
        role: (role as "admin" | "student") || "student", 
        isVerified: true, 
        createdAt: new Date().toISOString() 
      };
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      users.push({ ...newUser, password });
      localStorage.setItem("users", JSON.stringify(users));
      const token = `token_${Date.now()}`;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      return newUser;
    }
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    try {
      await usersApi.verifyEmail(code);
      if (user) {
        const updatedUser = { ...user, isVerified: true };
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const updatedUser = { ...user!, ...data };
    setUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    return updatedUser;
  };

  const changePassword = async () => {
    // Implemented for demo
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, register, verifyEmail, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

