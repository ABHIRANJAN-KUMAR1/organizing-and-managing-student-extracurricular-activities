import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ActivityCard } from "@/components/ActivityCard";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { ActivityCategory } from "@/types";

export default function Activities() {
  const navigate = useNavigate();
  const { activities, registerForActivity, unregisterFromActivity, deleteActivity } = useActivities();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | "All">("All");

  const isAdmin = user?.role === "admin";

  // Filter activities
  const filtered = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRegister = (activityId: string) => {
    if (user) {
      registerForActivity(user.id, activityId);
      toast.success("Successfully registered for the activity!");
    }
  };

  const handleUnregister = (activityId: string) => {
    if (user) {
      unregisterFromActivity(user.id, activityId);
      toast.success("Unregistered from the activity");
    }
  };

  const handleDelete = (activityId: string) => {
    deleteActivity(activityId);
    toast.success("Activity deleted successfully");
  };

  const handleEdit = (activityId: string) => {
    navigate(`/activities/${activityId}/edit`);
  };

  const categories: (ActivityCategory | "All")[] = ["All", "Clubs", "Sports", "Events"];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isAdmin ? "Activity Management" : "Browse Activities"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? "Manage all activities and registrations"
                : "Find and register for activities"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/activities/new")} className="gap-2">
              <Plus className="w-4 h-4" />
              New Activity
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Activities Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((activity) => {
              const isRegistered = user
                ? activity.currentParticipants.includes(user.id)
                : false;

              return (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isRegistered={isRegistered}
                  onRegister={() => handleRegister(activity.id)}
                  onUnregister={() => handleUnregister(activity.id)}
                  onEdit={() => handleEdit(activity.id)}
                  onDelete={() => handleDelete(activity.id)}
                  isAdmin={isAdmin}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                No activities found
              </p>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "All"
                  ? "Try adjusting your search or filter criteria"
                  : "No activities available yet"}
              </p>
              {isAdmin && (
                <Button onClick={() => navigate("/activities/new")}>
                  Create the first activity
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
