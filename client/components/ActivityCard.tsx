import { Activity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Users } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";

interface ActivityCardProps {
  activity: Activity;
  isRegistered?: boolean;
  onRegister?: () => void;
  onUnregister?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

const categoryColors: Record<string, string> = {
  Clubs: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Sports: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Events:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export const ActivityCard = ({
  activity,
  isRegistered = false,
  onRegister,
  onUnregister,
  onEdit,
  onDelete,
  isAdmin = false,
}: ActivityCardProps) => {
  const participantPercentage =
    (activity.currentParticipants.length / activity.maxParticipants) * 100;
  const eventDate = parseISO(activity.date);
  const isUpcoming = eventDate > new Date();
  const daysUntilEvent = formatDistanceToNow(eventDate, { addSuffix: true });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activity.title}
            </h3>
            <Badge className={categoryColors[activity.category]}>
              {activity.category}
            </Badge>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-xs"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-xs text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {activity.description}
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(eventDate, "MMM d, yyyy")} • {daysUntilEvent}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{activity.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {activity.currentParticipants.length} / {activity.maxParticipants}{" "}
              Participants
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Seats Available
            </span>
            <span className="text-xs font-semibold text-foreground">
              {Math.max(0, activity.maxParticipants - activity.currentParticipants.length)} left
            </span>
          </div>
          <Progress
            value={Math.min(participantPercentage, 100)}
            className="h-2"
          />
        </div>

        <div className="flex gap-2">
          {!isAdmin && (
            <>
              {isRegistered ? (
                <Button
                  onClick={onUnregister}
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10"
                >
                  Unregister
                </Button>
              ) : (
                <Button
                  onClick={onRegister}
                  disabled={
                    activity.currentParticipants.length >=
                    activity.maxParticipants
                  }
                  className="flex-1"
                >
                  {activity.currentParticipants.length >=
                  activity.maxParticipants
                    ? "Full"
                    : "Register"}
                </Button>
              )}
            </>
          )}
          {isUpcoming && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Upcoming
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
