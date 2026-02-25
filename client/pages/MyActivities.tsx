import { Layout } from "@/components/Layout";
import { ActivityCard } from "@/components/ActivityCard";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MyActivities() {
  const navigate = useNavigate();
  const { getUserActivities, unregisterFromActivity } = useActivities();
  const { user } = useAuth();

  const myActivities = user ? getUserActivities(user.id) : [];

  // Separate upcoming and past activities
  const now = new Date();
  const upcomingActivities = myActivities.filter(
    (a) => new Date(a.date) > now
  );
  const pastActivities = myActivities.filter((a) => new Date(a.date) <= now);

  const handleUnregister = (activityId: string) => {
    if (user) {
      unregisterFromActivity(user.id, activityId);
      toast.success("Unregistered from the activity");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Activities</h1>
            <p className="text-muted-foreground mt-1">
              Activities you're registered for
            </p>
          </div>
          <Button onClick={() => navigate("/activities")} className="gap-2">
            <BookOpen className="w-4 h-4" />
            Browse More
          </Button>
        </div>

        {/* Upcoming Activities */}
        {upcomingActivities.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Upcoming Activities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isRegistered={true}
                  onUnregister={() => handleUnregister(activity.id)}
                  isAdmin={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Activities */}
        {pastActivities.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Completed Activities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="opacity-60"
                >
                  <ActivityCard
                    activity={activity}
                    isRegistered={true}
                    isAdmin={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {myActivities.length === 0 && (
          <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">
                No activities yet
              </p>
              <p className="text-muted-foreground mb-6">
                Browse and register for activities to see them here
              </p>
              <Button onClick={() => navigate("/activities")}>
                Browse Activities
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
