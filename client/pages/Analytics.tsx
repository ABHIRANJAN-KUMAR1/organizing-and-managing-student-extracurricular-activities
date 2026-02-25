import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useActivities } from "@/context/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { 
  TrendingUp, Users, BookOpen, Calendar, 
  Clock, CheckCircle, Activity, ArrowUp, ArrowDown
} from "lucide-react";

export default function Analytics() {
  const { activities } = useActivities();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Get all users
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const totalStudents = users.length;

  // Calculate stats
  const totalActivities = activities.length;
  const upcomingActivities = activities.filter(a => new Date(a.date) > new Date()).length;
  const completedActivities = activities.filter(a => new Date(a.date) < new Date()).length;
  const totalRegistrations = activities.reduce((sum, a) => sum + a.currentParticipants.length, 0);
  const avgRegistrationsPerActivity = totalActivities > 0 ? (totalRegistrations / totalActivities).toFixed(1) : 0;

  // Category distribution
  const categoryData = [
    {
      name: "Clubs",
      value: activities.filter(a => a.category === "Clubs").length,
      registrations: activities.filter(a => a.category === "Clubs").reduce((sum, a) => sum + a.currentParticipants.length, 0)
    },
    {
      name: "Sports",
      value: activities.filter(a => a.category === "Sports").length,
      registrations: activities.filter(a => a.category === "Sports").reduce((sum, a) => sum + a.currentParticipants.length, 0)
    },
    {
      name: "Events",
      value: activities.filter(a => a.category === "Events").length,
      registrations: activities.filter(a => a.category === "Events").reduce((sum, a) => sum + a.currentParticipants.length, 0)
    },
    {
      name: "Other",
      value: activities.filter(a => !["Clubs", "Sports", "Events"].includes(a.category)).length,
      registrations: activities.filter(a => !["Clubs", "Sports", "Events"].includes(a.category)).reduce((sum, a) => sum + a.currentParticipants.length, 0)
    }
  ].filter(c => c.value > 0);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  // Monthly activity data (simulated for demo)
  const monthlyData = [
    { month: "Jan", activities: 3, registrations: 45 },
    { month: "Feb", activities: 5, registrations: 78 },
    { month: "Mar", activities: 4, registrations: 62 },
    { month: "Apr", activities: 6, registrations: 95 },
    { month: "May", activities: 4, registrations: 58 },
    { month: "Jun", activities: 7, registrations: 120 }
  ];

  // Top activities by registrations
  const topActivities = [...activities]
    .sort((a, b) => b.currentParticipants.length - a.currentParticipants.length)
    .slice(0, 5)
    .map(a => ({
      name: a.title.length > 20 ? a.title.substring(0, 20) + "..." : a.title,
      registrations: a.currentParticipants.length,
      capacity: a.maxParticipants,
      percentage: Math.round((a.currentParticipants.length / a.maxParticipants) * 100)
    }));

  // Recent activity trend
  const activityTrend = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((a, i) => ({
      name: a.title.substring(0, 15),
      participants: a.currentParticipants.length,
      index: i
    }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track activity performance and user engagement</p>
          </div>
          <div className="flex gap-2">
            {(["week", "month", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="w-3 h-3" /> +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                  <p className="text-3xl font-bold text-foreground">{totalActivities}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="w-3 h-3" /> +8% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                  <p className="text-3xl font-bold text-foreground">{totalRegistrations}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUp className="w-3 h-3" /> +24% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. per Activity</p>
                  <p className="text-3xl font-bold text-foreground">{avgRegistrationsPerActivity}</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <ArrowDown className="w-3 h-3" /> -3% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Registrations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Activity & Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activities" fill="#3b82f6" name="Activities" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="registrations" fill="#10b981" name="Registrations" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No activities yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Activities by Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topActivities.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topActivities} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="registrations" fill="#3b82f6" name="Registered" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No registrations yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="participants" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6" }}
                      name="Participants"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Upcoming Activities</td>
                    <td className="text-right py-3 px-4 font-medium">{upcomingActivities}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Completed Activities</td>
                    <td className="text-right py-3 px-4 font-medium">{completedActivities}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Total Capacity</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {activities.reduce((sum, a) => sum + a.maxParticipants, 0)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Average Fill Rate</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {totalActivities > 0 
                        ? Math.round((totalRegistrations / activities.reduce((sum, a) => sum + a.maxParticipants, 0)) * 100)
                        : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Students per Activity</td>
                    <td className="text-right py-3 px-4 font-medium">{avgRegistrationsPerActivity}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
