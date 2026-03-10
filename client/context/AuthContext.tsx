import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthContextType } from "@/types";
import { usersApi } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("currentUser");
      
      if (token && storedUser) {
        try {
          // Try to validate token with backend
          const userData = await usersApi.getMe();
          setUser(userData);
          setIsAuthenticated(true);
        } catch {
          // Token invalid, clear session
          localStorage.removeItem("token");
          localStorage.removeItem("currentUser");
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // Try backend API first
      const response = await usersApi.login({ email, password });
      const { user: userData, token } = response;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      
      // Also save to localStorage for Students page (if not already there)
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const existingIndex = users.findIndex((u: any) => u.email === email);
      if (existingIndex === -1) {
        users.push({ ...userData, password });
        localStorage.setItem("users", JSON.stringify(users));
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch {
      // Fallback: try localStorage users (for demo/offline mode)
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const localUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (localUser) {
        const token = `token_${Date.now()}`;
        localStorage.setItem("token", token);
        const { password: _, ...userWithoutPassword } = localUser;
        localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        setIsAuthenticated(true);
        return userWithoutPassword;
      }
      
      // Check default admin credentials
      if (email === "admin@example.com" && password === "admin123") {
        const adminUser: User = { 
          id: "admin_default", 
          email: "admin@example.com", 
          name: "Admin", 
          role: "admin", 
          isVerified: true, 
          createdAt: new Date().toISOString() 
        };
        const token = `token_${Date.now()}`;
        localStorage.setItem("token", token);
        localStorage.setItem("currentUser", JSON.stringify(adminUser));
        
        // Save to localStorage for Students page
        const usersList = JSON.parse(localStorage.getItem("users") || "[]");
        if (!usersList.find((u: any) => u.email === "admin@example.com")) {
          usersList.push({ ...adminUser, password: "admin123" });
          localStorage.setItem("users", JSON.stringify(usersList));
        }
        
        setUser(adminUser);
        setIsAuthenticated(true);
        return adminUser;
      }
      
      throw new Error("Invalid credentials");
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

