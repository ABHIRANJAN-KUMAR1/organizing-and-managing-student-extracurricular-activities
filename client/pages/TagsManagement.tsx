import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", 
  "#ec4899", "#6b7280"
];

export default function TagsManagement() {
  const [tags, setTags] = useState<{id: string; name: string; color: string}[]>(() => {
    const stored = localStorage.getItem("activity_tags");
    return stored ? JSON.parse(stored) : [];
  });
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error("Please enter a tag name");
      return;
    }
    if (tags.find(t => t.name.toLowerCase() === newTagName.toLowerCase())) {
      toast.error("Tag already exists");
      return;
    }

    const newTag = {
      id: `tag_${Date.now()}`,
      name: newTagName.trim(),
      color: selectedColor
    };

    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    localStorage.setItem("activity_tags", JSON.stringify(updatedTags));
    setNewTagName("");
    toast.success("Tag added successfully");
  };

  const handleDeleteTag = (id: string) => {
    const updatedTags = tags.filter(t => t.id !== id);
    setTags(updatedTags);
    localStorage.setItem("activity_tags", JSON.stringify(updatedTags));
    toast.success("Tag deleted");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tags Management</h1>
          <p className="text-muted-foreground mt-1">Manage activity tags for better organization</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Add New Tag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button onClick={handleAddTag}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? "scale-110 ring-2 ring-offset-2 ring-gray-400" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <Badge style={{ backgroundColor: selectedColor }}>{newTagName || "Tag Name"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Tags ({tags.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: tag.color }}>{tag.name}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteTag(tag.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No tags yet. Create your first tag above!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

