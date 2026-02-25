import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getActivity, registerForActivity, unregisterFromActivity } = useActivities();
  const { user } = useAuth();

  const activity = id ? getActivity(id) : null;

  if (!activity) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">Activity not found</p>
          <Button onClick={() => navigate("/activities")}>Back to Activities</Button>
        </div>
      </Layout>
    );
  }

  const isRegistered = user ? activity.currentParticipants.includes(user.id) : false;
  const capacityPercentage = (activity.currentParticipants.length / activity.maxParticipants) * 100;
  const spotsAvailable = activity.maxParticipants - activity.currentParticipants.length;
  const isUpcoming = new Date(activity.date) > new Date();

  const handleRegister = () => {
    if (user) {
      if (spotsAvailable <= 0) {
        toast.error("This activity is full");
        return;
      }
      registerForActivity(user.id, activity.id);
      toast.success("Successfully registered for the activity!");
    }
  };

  const handleUnregister = () => {
    if (user) {
      unregisterFromActivity(user.id, activity.id);
      toast.success("Unregistered from the activity");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/activities")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Activities
        </Button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {activity.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{activity.category}</Badge>
                    {isUpcoming && <Badge className="bg-green-500">Upcoming</Badge>}
                    {!isUpcoming && <Badge className="bg-gray-500">Completed</Badge>}
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-lg mb-6">
                {activity.description}
              </p>

              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">
                      {formatDate(new Date(activity.date))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Venue</p>
                    <p className="font-medium text-foreground">{activity.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Participants</p>
                    <p className="font-medium text-foreground">
                      {activity.currentParticipants.length} / {activity.maxParticipants}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Capacity</h2>
              <div className="space-y-3">
                <Progress value={capacityPercentage} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {activity.currentParticipants.length} of {activity.maxParticipants} spots filled
                  </span>
                  <span className={`font-medium ${spotsAvailable > 0 ? "text-green-600" : "text-red-600"}`}>
                    {spotsAvailable > 0 ? `${spotsAvailable} spots available` : "Activity full"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">About This Activity</h2>
              <p className="text-muted-foreground leading-relaxed">
                {activity.description}
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Category:</span> {activity.category}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Registration Status</p>
                {isRegistered ? (
                  <Badge className="bg-green-500">✓ Registered</Badge>
                ) : (
                  <Badge variant="outline">Not Registered</Badge>
                )}
              </div>

              {user?.role === "student" && (
                <>
                  {isRegistered ? (
                    <Button
                      onClick={handleUnregister}
                      variant="destructive"
                      className="w-full"
                    >
                      Unregister
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      disabled={spotsAvailable <= 0}
                      className="w-full"
                    >
                      {spotsAvailable > 0 ? "Register Now" : "Activity Full"}
                    </Button>
                  )}
                </>
              )}

              {user?.role === "admin" && (
                <>
                  <Button
                    onClick={() => navigate(`/activities/${activity.id}/edit`)}
                    className="w-full"
                  >
                    Edit Activity
                  </Button>
                </>
              )}

              {/* Activity Stats */}
              <div className="pt-4 border-t border-border space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Activity Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {isUpcoming ? "Upcoming" : "Completed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spots Left</span>
                    <span className="font-medium">{spotsAvailable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium">{Math.round(capacityPercentage)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
