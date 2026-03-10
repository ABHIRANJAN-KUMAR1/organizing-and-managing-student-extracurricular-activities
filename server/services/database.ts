import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generic file-based database
class FileDB<T extends { id: string }> {
  private filePath: string;
  private data: T[] = [];

  constructor(filename: string) {
    this.filePath = path.join(DATA_DIR, filename);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error(`Error loading ${this.filePath}:`, error);
      this.data = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error(`Error saving ${this.filePath}:`, error);
    }
  }

  findAll(): T[] {
    return [...this.data];
  }

  findById(id: string): T | undefined {
    return this.data.find(item => item.id === id);
  }

  findMany(predicate: (item: T) => boolean): T[] {
    return this.data.filter(predicate);
  }

  create(item: T): T {
    this.data.push(item);
    this.save();
    return item;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      this.save();
      return this.data[index];
    }
    return undefined;
  }

  delete(id: string): boolean {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  push(item: T): T {
    return this.create(item);
  }
}

// Initialize all databases
export const activitiesDb = new FileDB<any>("activities.json");
export const usersDb = new FileDB<any>("users.json");
export const categoriesDb = new FileDB<any>("categories.json");
export const feedbacksDb = new FileDB<any>("feedbacks.json");
export const checkInsDb = new FileDB<any>("checkins.json");
export const tagsDb = new FileDB<any>("tags.json");
export const notificationsDb = new FileDB<any>("notifications.json");
export const notificationSettingsDb = new FileDB<any>("notificationSettings.json");
export const favoritesDb = new FileDB<any>("favorites.json");
export const certificatesDb = new FileDB<any>("certificates.json");
export const broadcastMessagesDb = new FileDB<any>("broadcastMessages.json");
export const remindersDb = new FileDB<any>("reminders.json");
export const activityHistoryDb = new FileDB<any>("activityHistory.json");
export const achievementsDb = new FileDB<any>("achievements.json");

// Initialize with seed data
export function seedDatabase() {
  // Seed categories if empty
  if (categoriesDb.findAll().length === 0) {
    const categories = [
      { id: "cat_1", name: "Clubs", createdAt: new Date().toISOString() },
      { id: "cat_2", name: "Sports", createdAt: new Date().toISOString() },
      { id: "cat_3", name: "Events", createdAt: new Date().toISOString() },
    ];
    categories.forEach(cat => categoriesDb.create(cat));
  }

  // Seed tags if empty
  if (tagsDb.findAll().length === 0) {
    const tags = [
      { id: "tag_1", name: "Indoor", color: "#3b82f6", createdAt: new Date().toISOString() },
      { id: "tag_2", name: "Outdoor", color: "#10b981", createdAt: new Date().toISOString() },
      { id: "tag_3", name: "Online", color: "#8b5cf6", createdAt: new Date().toISOString() },
      { id: "tag_4", name: "Free", color: "#f59e0b", createdAt: new Date().toISOString() },
    ];
    tags.forEach(tag => tagsDb.create(tag));
  }

  // Seed a demo admin user if empty
  if (usersDb.findAll().length === 0) {
    const adminUser = {
      id: "admin_1",
      email: "admin@activityhub.com",
      name: "Admin",
      password: "admin123", // In production, hash this!
      role: "admin",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    usersDb.create(adminUser);

    const studentUser = {
      id: "student_1",
      email: "student@activityhub.com",
      name: "Student",
      password: "student123", // In production, hash this!
      role: "student",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    usersDb.create(studentUser);
  }

  // Seed sample activities if empty
  if (activitiesDb.findAll().length === 0) {
    const activities = [
      {
        id: "activity_1",
        title: "Basketball Tournament",
        description: "Inter-college basketball tournament with exciting matches",
        category: "Sports",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        venue: "Sports Complex",
        maxParticipants: 30,
        currentParticipants: [],
        waitlist: [],
        comments: [],
        ratings: [],
        tags: ["Outdoor"],
        createdBy: "admin_1",
        createdAt: new Date().toISOString(),
        requiresApproval: false,
        approvedParticipants: [],
        pendingParticipants: [],
        rejectedParticipants: [],
        checkIns: [],
        feedbacks: [],
        photos: [],
      },
      {
        id: "activity_2",
        title: "Coding Club Meetup",
        description: "Weekly meetup for coding enthusiasts to discuss new technologies",
        category: "Clubs",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        venue: "Tech Lab",
        maxParticipants: 50,
        currentParticipants: [],
        waitlist: [],
        comments: [],
        ratings: [],
        tags: ["Indoor", "Online"],
        createdBy: "admin_1",
        createdAt: new Date().toISOString(),
        requiresApproval: false,
        approvedParticipants: [],
        pendingParticipants: [],
        rejectedParticipants: [],
        checkIns: [],
        feedbacks: [],
        photos: [],
      },
    ];
    activities.forEach(activity => activitiesDb.create(activity));
  }
}

// Run seeding on module load
seedDatabase();

