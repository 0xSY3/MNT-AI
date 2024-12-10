import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const contracts = pgTable("contracts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const templates = pgTable("templates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const forumPosts = pgTable("forum_posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const deployments = pgTable("deployments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  contractId: integer("contract_id").references(() => contracts.id),
  address: text("address").notNull(),
  network: text("network").notNull(),
  deployedAt: timestamp("deployed_at").defaultNow(),
  metadata: jsonb("metadata")
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertContractSchema = createInsertSchema(contracts);
export const selectContractSchema = createSelectSchema(contracts);
export const insertTemplateSchema = createInsertSchema(templates);
export const selectTemplateSchema = createSelectSchema(templates);
export const insertForumPostSchema = createInsertSchema(forumPosts);
export const selectForumPostSchema = createSelectSchema(forumPosts);

export type User = z.infer<typeof selectUserSchema>;
export type Contract = z.infer<typeof selectContractSchema>;
export type Template = z.infer<typeof selectTemplateSchema>;
export type ForumPost = z.infer<typeof selectForumPostSchema>;
