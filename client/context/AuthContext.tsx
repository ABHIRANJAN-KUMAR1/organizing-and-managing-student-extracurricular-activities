import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("currentUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
  };

  const register = (userData: User) => {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const userWithVerification = {
      ...userData,
      isVerified: false,
      verificationCode,
    };
    
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (!users.find((u: User) => u.email === userData.email)) {
      users.push(userWithVerification);
      localStorage.setItem("users", JSON.stringify(users));
    }
    localStorage.setItem("pendingVerification", JSON.stringify(userWithVerification));
  };

  const verifyEmail = (code: string): boolean => {
    const pendingUser = localStorage.getItem("pendingVerification");
    if (pendingUser) {
      const parsed = JSON.parse(pendingUser);
      if (parsed.verificationCode === code) {
        const verifiedUser = { ...parsed, isVerified: true };
        
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const updatedUsers = users.map((u: User) => 
          u.id === verifiedUser.id ? verifiedUser : u
        );
        localStorage.setItem("users", JSON.stringify(updatedUsers));
        
        login(verifiedUser);
        localStorage.removeItem("pendingVerification");
        return true;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        register,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
