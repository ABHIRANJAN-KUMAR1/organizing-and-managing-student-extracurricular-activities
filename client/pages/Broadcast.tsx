import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Bell, Send, Users, Shield, Target, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Broadcast() {
  const { user } = useAuth();
  const { addBroadcastNotification } = useNotifications();
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "students" | "admins">("students");
  const [notificationType, setNotificationType] = useState<"info" | "success" | "warning" | "error">("info");
  const [isSending, setIsSending] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Load broadcast history
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("broadcast_history") || "[]");
    setBroadcastHistory(history);
  }, []);

  // Get all users for counting
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const studentCount = users.filter((u: any) => u.role === "student").length;
  const adminCount = users.filter((u: any) => u.role === "admin").length;

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);

    // Simulate sending broadcast
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add the broadcast notification
    addBroadcastNotification(title, message, notificationType);

    // Also store in a broadcast history for admins
    const newBroadcast = {
      id: `broadcast_${Date.now()}`,
      title,
      message,
      targetAudience,
      notificationType,
      createdBy: user?.name || "Admin",
      createdAt: new Date().toISOString()
    };
    const updatedHistory = [newBroadcast, ...broadcastHistory];
    localStorage.setItem("broadcast_history", JSON.stringify(updatedHistory));
    setBroadcastHistory(updatedHistory);

    setIsSending(false);
    setTitle("");
    setMessage("");
    
    const audienceText = targetAudience === "all" ? "all users" : targetAudience === "students" ? "all students" : "all admins";
    toast.success(`Message broadcasted to ${audienceText}!`);
  };

  // Delete broadcast message
  const deleteBroadcast = (broadcastId: string) => {
    const updated = broadcastHistory.filter((b) => b.id !== broadcastId);
    localStorage.setItem("broadcast_history", JSON.stringify(updated));
    setBroadcastHistory(updated);
    toast.success("Message deleted successfully!");
  };

  // Refresh history
  const refreshHistory = () => {
    const history = JSON.parse(localStorage.getItem("broadcast_history") || "[]");
    setBroadcastHistory(history);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Broadcast Messages</h1>
            <p className="text-muted-foreground mt-1">
              Send announcements and notifications to students or admins
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Create Broadcast Message
            </CardTitle>
            <CardDescription>
              Reach out to your entire community with important announcements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                placeholder="Enter message title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <RadioGroup 
                value={targetAudience} 
                onValueChange={(v) => setTargetAudience(v as "all" | "students" | "admins")}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    Everyone ({studentCount + adminCount} users)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="students" id="students" />
                  <Label htmlFor="students" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    Students Only ({studentCount} students)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admins" id="admins" />
                  <Label htmlFor="admins" className="flex items-center gap-2 cursor-pointer">
                    <Target className="w-4 h-4" />
                    Admins Only ({adminCount} admins)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select 
                value={notificationType} 
                onValueChange={(v) => setNotificationType(v as "info" | "success" | "warning" | "error")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">📢 Info (Blue)</SelectItem>
                  <SelectItem value="success">✅ Success (Green)</SelectItem>
                  <SelectItem value="warning">⚠️ Warning (Orange)</SelectItem>
                  <SelectItem value="error">❌ Error (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleBroadcast} 
              disabled={isSending || !title.trim() || !message.trim()}
              className="w-full gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Broadcast Message"}
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Broadcast History</CardTitle>
                <CardDescription>
                  View your previously sent messages
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refreshHistory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {broadcastHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No broadcast messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {broadcastHistory.slice(0, 10).map((broadcast) => (
                  <div 
                    key={broadcast.id} 
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            broadcast.notificationType === "info" ? "bg-blue-500" :
                            broadcast.notificationType === "success" ? "bg-green-500" :
                            broadcast.notificationType === "warning" ? "bg-orange-500" : "bg-red-500"
                          }`} />
                          <h4 className="font-medium text-foreground">{broadcast.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{broadcast.message}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant="outline">{broadcast.targetAudience}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(broadcast.createdAt).toLocaleDateString()}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteBroadcast(broadcast.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

