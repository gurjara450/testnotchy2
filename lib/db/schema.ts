import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

// Enum for roles in the system
export const userSystemEnum = pgEnum("user_system_enum", ["system", "user", "assistant"]);

// Enum for note background styles
export const noteBackgroundEnum = pgEnum("note_background_enum", ["plain", "ruled", "dotted", "grid"]);

// Enum for note font styles
export const noteFontEnum = pgEnum("note_font_enum", ["default", "handwritten1", "handwritten2", "casual"]);

// Enum for subscription plan types
export const subscriptionPlanEnum = pgEnum("subscription_plan_enum", ["free", "base", "plus"]);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum("subscription_status_enum", ["active", "cancelled", "expired"]);

// Table to store chat metadata
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(), // Primary key
  pdfName: text("pdf_name").notNull(), // Name of the uploaded PDF
  pdfUrl: text("pdf_url").notNull(), // URL to access the uploaded PDF
  createdAt: timestamp("created_at").notNull().defaultNow(), // Timestamp when chat is created
  userId: varchar("user_id", { length: 256 }).notNull(), // ID of the user associated with the chat
  fileKey: text("file_key").notNull(), // Key to reference the file in storage
});

// Type inference for Drizzle to use in queries
export type DrizzleChat = typeof chats.$inferSelect;

// Table to store chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(), // Primary key
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(), // Foreign key referencing the `chats` table
  content: text("content").notNull(), // Message content
  createdAt: timestamp("created_at").notNull().defaultNow(), // Timestamp when message is created
  role: userSystemEnum("role").notNull(), // Role of the message sender (system or user)
});

// Type inference for Drizzle to use in queries
export type DrizzleMessage = typeof messages.$inferSelect;

// Table to store notebook data
export const notebooks = pgTable("notebooks", {
  id: serial("id").primaryKey(), // Unique identifier for each notebook
  userId: varchar("user_id", { length: 256 }).notNull(), // ID of the user who owns the notebook
  name: varchar("name", { length: 256 }).notNull(), // Name of the notebook
  type: varchar("type", { length: 128 }).notNull(), // Type or category of the notebook (e.g., "personal", "work")
  date: timestamp("date").defaultNow().notNull(), // Timestamp when the notebook is created
  sources: integer("sources").default(0).notNull(), // Number of sources associated with the notebook
});

// Table to store MCQs
export const mcqs = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  notebookId: integer("notebook_id")
    .references(() => notebooks.id)
    .notNull(),
  fileKey: text("file_key").notNull(),
  questions: jsonb("questions").notNull(), // Store MCQ data as JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table to store Flashcards
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  notebookId: integer("notebook_id")
    .references(() => notebooks.id)
    .notNull(),
  fileKey: text("file_key").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  embeddings: jsonb("embeddings"), // Store embeddings as JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table to store Mind Maps
export const mindmaps = pgTable("mindmaps", {
  id: serial("id").primaryKey(),
  notebookId: integer("notebook_id")
    .references(() => notebooks.id)
    .notNull(),
  fileKey: text("file_key").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Store mind map structure as JSON
  embeddings: jsonb("embeddings"), // Store embeddings as JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
});

// Type inference for Drizzle to use in queries
export type DrizzleNotebook = typeof notebooks.$inferSelect;
export type DrizzleMCQ = typeof mcqs.$inferSelect;
export type DrizzleFlashcard = typeof flashcards.$inferSelect;
export type DrizzleMindMap = typeof mindmaps.$inferSelect;

// Table to store notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  notebookId: integer("notebook_id")
    .references(() => notebooks.id)
    .notNull(),
  content: text("content").notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  background: noteBackgroundEnum("background").default("plain").notNull(),
  font: noteFontEnum("font").default("default").notNull(),
  lineHeight: integer("line_height"),
  letterSpacing: integer("letter_spacing"),
  textColor: text("text_color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Table to store sources (PDF files, documents, etc.)
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  notebookId: integer("notebook_id")
    .references(() => notebooks.id)
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  key: text("file_key").notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add to type exports
export type DrizzleNote = typeof notes.$inferSelect;
export type DrizzleSource = typeof sources.$inferSelect;

// Subscriptions table with proper enums
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  planType: subscriptionPlanEnum("plan_type").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  features: jsonb("features").notNull().default([]),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DrizzleSubscription = typeof subscriptions.$inferSelect; 