import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/types";
import { Activity } from "<create_file>
<absolute_path>
c:/Users/Abhiranjan/Downloads/activity-hub-manager-7a6 (1)/client/pages/Login.tsx</absolute_path>
<content>
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/types";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const existingUser = users.find(
        (u: any) => u.email === email && u.role === role
      );

      if (existingUser) {
        login(existingUser);
        toast.success(`Welcome back, ${existingUser.name}!`);
        navigate("/dashboard");
      } else if (role === "admin" && email === "admin@example.com" && password === "admin123") {
        const adminUser = {
          id: "admin1",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin" as const,
          createdAt: new Date().toISOString(),
        };
        login(adminUser);
        toast.success("Welcome back, Admin!");
        navigate("/dashboard");
      } else {
        const userByEmail = users.find((u: any) => u.email === email);
        if (userByEmail) {
          login(userByEmail);
          toast.success(`Welcome back, ${userByEmail.name}!`);
          navigate("/dashboard");
        } else {
          toast.error("Invalid credentials. Try admin@example.com / admin123 for admin, or register as student");
        }
      }

      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground">Activity Hub Manager</span>
              <span className="text-xs text-muted-foreground">Organizing and Managing Student Extracurricular Activities</span>
            </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Sign in to your account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Login As
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["admin", "student"] as const).map((userRole) => (
                  <button
                    key={userRole}
                    type="button"
                    onClick={() => setRole(userRole)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium capitalize transition-all ${
                      role === userRole
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "border-border bg-background text-foreground hover:border-border/80"
                    }`}
                  >
                    {userRole}
                  </button>
                ))}
              </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder={
                  role === "admin" ? "admin@example.com" : "your@email.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Password
              </label>
              <Input
                type="password"
                placeholder={role === "admin" ? "admin123" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-6"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center mt-4">
              <Link
                to="/password-reset"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Demo Credentials:
            </p>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-xs font-mono">
              <p className="text-foreground">
                Admin: admin@example.com / admin123
              </p>
              <p className="text-muted-foreground">
                (Or register as a new student)
              </p>
            </div>
        </div>
    </div>
  );
}
