import { Activity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Users, Star, Clock, Heart } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";

interface ActivityCardProps {
  activity: Activity;
  isRegistered?: boolean;
  isOnWaitlist?: boolean;
  onRegister?: () => void;
  onUnregister?: () => void;
  onJoinWaitlist?: () => void;
  onLeaveWaitlist?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  isAdmin?: boolean;
  isFavorite?: boolean;
  showFavoriteButton?: boolean;
}

const categoryColors: Record<string, string> = {
  Clubs: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Sports: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Events: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Workshops: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Seminar: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  Cultural: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

export const ActivityCard = ({
  activity,
  isRegistered = false,
  isOnWaitlist = false,
  onRegister,
  onUnregister,
  onJoinWaitlist,
  onLeaveWaitlist,
  onEdit,
  onDelete,
  onToggleFavorite,
  isAdmin = false,
  isFavorite = false,
  showFavoriteButton = false,
}: ActivityCardProps) => {
  const participantPercentage = (activity.currentParticipants.length / activity.maxParticipants) * 100;
  const isFull = activity.currentParticipants.length >= activity.maxParticipants;
  const eventDate = parseISO(activity.date);
  const isUpcoming = eventDate > new Date();
  const daysUntilEvent = formatDistanceToNow(eventDate, { addSuffix: true });
  
  // Calculate average rating
  const averageRating = activity.ratings.length > 0
    ? (activity.ratings.reduce((sum, r) => sum + r.score, 0) / activity.ratings.length).toFixed(1)
    : null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activity.title}
            </h3>
            <Badge className={categoryColors[activity.category] || "bg-gray-100 text-gray-800"}>
              {activity.category}
            </Badge>
          </div>
          <div className="flex gap-2">
            {showFavoriteButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleFavorite}
                className={`text-xs ${isFavorite ? "text-red-500" : "text-muted-foreground"}`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            )}
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit} className="text-xs">
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete} className="text-xs text-destructive hover:text-destructive">
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {activity.description}
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(eventDate, "MMM d, yyyy")} • {daysUntilEvent}</span>
          </div>
          {/* Time Display */}
          {(activity.startTime || activity.endTime) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {activity.startTime && activity.endTime 
                  ? `${activity.startTime} - ${activity.endTime}`
                  : activity.startTime 
                    ? `Starts at ${activity.startTime}`
                    : `Ends at ${activity.endTime}`
                }
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{activity.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{activity.currentParticipants.length} / {activity.maxParticipants} Participants</span>
          </div>
          
          {/* Waitlist count */}
          {activity.waitlist.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{activity.waitlist.length} on waitlist</span>
            </div>
          )}
          
          {/* Rating display */}
          {averageRating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{averageRating} ({activity.ratings.length} reviews)</span>
            </div>
          )}
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
          <Progress value={Math.min(participantPercentage, 100)} className="h-2" />
        </div>

        <div className="flex gap-2 flex-wrap">
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
              ) : isFull ? (
                <>
                  {isOnWaitlist ? (
                    <Button
                      onClick={onLeaveWaitlist}
                      variant="outline"
                      className="flex-1 text-orange-600 hover:bg-orange-600/10"
                    >
                      Leave Waitlist
                    </Button>
                  ) : (
                    <Button
                      onClick={onJoinWaitlist}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      Join Waitlist
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={onRegister} className="flex-1">
                  Register
                </Button>
              )}
            </>
          )}
          {isUpcoming && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium self-center">
              ✓ Upcoming
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
