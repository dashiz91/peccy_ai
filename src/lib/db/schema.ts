import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const generationStatusEnum = pgEnum('generation_status', [
  'pending',
  'analyzing',
  'generating',
  'completed',
  'failed',
])

export const imageTypeEnum = pgEnum('image_type', [
  'main',
  'infographic_1',
  'infographic_2',
  'lifestyle',
  'comparison',
  'framework_preview',
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase',
  'usage',
  'refund',
  'bonus',
])

// Tables
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  credits: integer('credits').default(10).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const generations = pgTable('generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  productTitle: text('product_title').notNull(),
  productDescription: text('product_description'),
  features: text('features').array(),
  targetAudience: text('target_audience'),
  brandName: text('brand_name'),
  status: generationStatusEnum('status').default('pending').notNull(),
  frameworkData: jsonb('framework_data'),
  selectedFramework: jsonb('selected_framework'),
  imagePrompts: jsonb('image_prompts'),
  colorMode: text('color_mode'),
  lockedColors: text('locked_colors').array(),
  styleReferencePath: text('style_reference_path'),
  globalNote: text('global_note'),
  creditsUsed: integer('credits_used').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const generatedImages = pgTable('generated_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  generationId: uuid('generation_id')
    .references(() => generations.id, { onDelete: 'cascade' })
    .notNull(),
  imageType: imageTypeEnum('image_type').notNull(),
  storagePath: text('storage_path').notNull(),
  promptUsed: text('prompt_used'),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  amount: integer('amount').notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  generationId: uuid('generation_id').references(() => generations.id, {
    onDelete: 'set null',
  }),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  generations: many(generations),
  creditTransactions: many(creditTransactions),
}))

export const generationsRelations = relations(generations, ({ one, many }) => ({
  user: one(profiles, {
    fields: [generations.userId],
    references: [profiles.id],
  }),
  images: many(generatedImages),
  creditTransactions: many(creditTransactions),
}))

export const generatedImagesRelations = relations(generatedImages, ({ one }) => ({
  generation: one(generations, {
    fields: [generatedImages.generationId],
    references: [generations.id],
  }),
}))

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(profiles, {
    fields: [creditTransactions.userId],
    references: [profiles.id],
  }),
  generation: one(generations, {
    fields: [creditTransactions.generationId],
    references: [generations.id],
  }),
}))

// Types
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export type Generation = typeof generations.$inferSelect
export type NewGeneration = typeof generations.$inferInsert

export type GeneratedImage = typeof generatedImages.$inferSelect
export type NewGeneratedImage = typeof generatedImages.$inferInsert

export type CreditTransaction = typeof creditTransactions.$inferSelect
export type NewCreditTransaction = typeof creditTransactions.$inferInsert
