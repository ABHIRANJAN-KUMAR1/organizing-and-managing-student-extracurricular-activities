import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Activity, ActivityCategory } from "@/types";

export default function ActivityForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getActivity, addActivity, updateActivity, categories } = useActivities();
  const { user } = useAuth();

  const isEditing = !!id;
  const activity = id ? getActivity(id) : null;

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg font-medium text-foreground mb-4">
            Only admins can create or edit activities
          </p>
          <Button onClick={() => navigate("/activities")}>Back to Activities</Button>
        </div>
      </Layout>
    );
  }

  const [formData, setFormData] = useState({
    title: activity?.title || "",
    description: activity?.description || "",
    category: (activity?.category || "Clubs") as ActivityCategory,
    date: activity?.date || "",
    venue: activity?.venue || "",
    maxParticipants: activity?.maxParticipants || 50,
  });

  const [isLoading, setIsLoading] = useState(false);

  const categoryOptions = categories.length > 0 
    ? categories.map(c => c.name as ActivityCategory)
    : ["Clubs", "Sports", "Events", "Workshops", "Seminar", "Cultural"] as ActivityCategory[];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxParticipants" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.date || !formData.venue || formData.maxParticipants < 1) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (isEditing && activity) {
        updateActivity(activity.id, formData);
        toast.success("Activity updated successfully!");
      } else {
        const newActivity: Activity = {
          id: `activity_${Date.now()}`,
          ...formData,
          currentParticipants: [],
          waitlist: [],
          comments: [],
          ratings: [],
          createdBy: user?.id || "admin",
          createdAt: new Date().toISOString(),
        };
        addActivity(newActivity);
        toast.success("Activity created successfully!");
      }

      setIsLoading(false);
      navigate("/activities");
    }, 600);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/activities")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Activities
        </Button>

        <div className="bg-card border border-border rounded-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? "Edit Activity" : "Create New Activity"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing ? "Update the activity details below" : "Fill in the details to create a new activity"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Activity Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Basketball Tournament 2024"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 h-11"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the activity..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <Input type="date" name="date" value={formData.date} onChange={handleChange} className="h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Venue <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g., Sports Complex"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Max Participants <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                min="1"
                max="10000"
                className="h-11"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="submit" disabled={isLoading} className="flex-1 h-12 text-base">
                {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Activity" : "Create Activity")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/activities")} className="h-12 px-6">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
