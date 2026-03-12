import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Search, CheckCircle, XCircle, Calendar, 
  MapPin, Clock, QrCode, UserCheck, UserX
} from "lucide-react";
import { toast } from "sonner";

export default function CheckIn() {
  const { activities, updateActivity } = useActivities();
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Get upcoming activities
  const upcomingActivities = activities.filter(
    a => new Date(a.date) <= new Date() && a.currentParticipants.length > 0
  );

  const activity = activities.find(a => a.id === selectedActivity);
  
  // Get users from activity context or mock for dashboard (real data server-side)
  const participants = activity ? activity.currentParticipants.map(id => {
    const userInfo = {
      name: id === "user_1773122259066" ? "rohan" : 
            id === "user_1773122299571" ? "himanshu" :
            "Student",
      email: id.includes("24000") ? id + "@kluniversity.in" : "student@example.com"
    };
    const checkIn = activity.checkIns?.find(c => c.userId === id);
    return {
      id,
      ...userInfo,
      checkedIn: !!checkIn,
      checkInTime: checkIn?.checkedInAt
    };
  }) : []; 

  // Filter participants
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedInCount = participants.filter(p => p.checkedIn).length;

  const handleCheckIn = (userId: string) => {
    if (!activity || !user) return;

    const existingCheckIn = activity.checkIns?.find(c => c.userId === userId);
    if (existingCheckIn) {
      toast.error("User already checked in");
      return;
    }

    const newCheckIn = {
      id: `checkin_${Date.now()}`,
      userId,
      userName: participants.find(p => p.id === userId)?.name || "Unknown",
      activityId: activity.id,
      checkedInAt: new Date().toISOString(),
      checkedInBy: user.name
    };

    updateActivity(activity.id, {
      checkIns: [...(activity.checkIns || []), newCheckIn]
    });

    toast.success("Check-in successful!");
  };

  const handleCheckOut = (userId: string) => {
    if (!activity) return;

    const updatedCheckIns = (activity.checkIns || []).filter(c => c.userId !== userId);
    updateActivity(activity.id, { checkIns: updatedCheckIns });
    toast.success("Check-out successful!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check-In System</h1>
          <p className="text-muted-foreground mt-1">
            Check-in participants for activities
          </p>
        </div>

        {/* Activity Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
<select
              aria-label="Select activity for check-in"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">Select an activity...</option>
              {upcomingActivities.map(a => (
                <option key={a.id} value={a.id}>
                  {a.title} - {new Date(a.date).toLocaleDateString()}
                </option>
              ))}
            </select>

            {activity && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{activity.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {checkedInCount} / {participants.length} checked in
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedActivity && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Participants List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredParticipants.length > 0 ? (
                  <div className="space-y-3">
                    {filteredParticipants.map(participant => (
                      <div 
                        key={participant.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            participant.checkedIn ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                          }`}>
                            {participant.checkedIn ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">
                                {participant.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.checkedIn ? (
                            <>
                              <Badge className="bg-green-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(participant.checkInTime!).toLocaleTimeString()}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckOut(participant.id)}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline">Not checked in</Badge>
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(participant.id)}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Check In
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No participants found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}

