import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, RefreshCw } from "lucide-react";
import { User } from "@/types";

export default function Students() {
  const { activities } = useActivities();
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<User[]>([]);

  // Load students from localStorage
  useEffect(() => {
    const loadStudents = () => {
      const allUsers: User[] = JSON.parse(localStorage.getItem("users") || "[]");
      const studentList = allUsers.filter((user) => user.role === "student");
      setStudents(studentList);
    };
    
    loadStudents();
    
    // Listen for storage changes (when user registers in another tab)
    window.addEventListener('storage', loadStudents);
    return () => window.removeEventListener('storage', loadStudents);
  }, []);

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get student activity registrations
  const getStudentActivityCount = (studentId: string) => {
    return activities.filter((activity) =>
      activity.currentParticipants.includes(studentId)
    ).length;
  };

  // Get upcoming activities for a student
  const getStudentUpcomingActivities = (studentId: string) => {
    const now = new Date();
    return activities.filter(
      (activity) =>
        activity.currentParticipants.includes(studentId) &&
        new Date(activity.date) > now
    ).length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all registered students
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const allUsers: User[] = JSON.parse(localStorage.getItem("users") || "[]");
              const studentList = allUsers.filter((user) => user.role === "student");
              setStudents(studentList);
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">{students.length} Students</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Students Table/Grid */}
        {filteredStudents.length > 0 ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Total Activities
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Upcoming Events
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Member Since
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const activityCount = getStudentActivityCount(student.id);
                    const upcomingCount = getStudentUpcomingActivities(student.id);
                    const memberDate = new Date(student.createdAt);
                    const memberSince = new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(memberDate);

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="secondary">{activityCount}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {upcomingCount > 0 ? (
                            <Badge className="bg-green-500">{upcomingCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {memberSince}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {activityCount > 0 ? (
                            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] bg-muted/30 rounded-lg">
            <div className="text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">
                {students.length === 0 ? "No students registered" : "No students found"}
              </p>
              <p className="text-muted-foreground">
                {students.length === 0
                  ? "Students will appear here once they register"
                  : "Try adjusting your search criteria"}
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Students</p>
              <p className="text-3xl font-bold text-foreground">{students.length}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Active Students</p>
              <p className="text-3xl font-bold text-foreground">
                {
                  students.filter(
                    (s) => getStudentActivityCount(s.id) > 0
                  ).length
                }
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Registrations</p>
              <p className="text-3xl font-bold text-foreground">
                {activities.reduce((sum, activity) => sum + activity.currentParticipants.length, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
