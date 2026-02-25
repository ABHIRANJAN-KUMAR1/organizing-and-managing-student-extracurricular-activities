import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function EmailVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, verifyEmail } = useAuth();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const success = verifyEmail(code);
      if (success) {
        toast.success("Email verified successfully!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleResendCode = () => {
    setIsResending(true);
    setTimeout(() => {
      toast.success("New verification code sent to your email!");
      setIsResending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground">Activity Hub Manager</span>
              <span className="text-xs text-muted-foreground">Activity Management</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground">
              We've sent a verification code to your email address.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {/* Verification Code Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Verification Code
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-10 text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-6"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="bg-muted/50 rounded-lg p-3 text-xs">
              <p className="text-muted-foreground">
                <strong>Demo:</strong> Enter any 6-digit code (e.g., 123456) to verify.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
