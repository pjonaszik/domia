// /lib/db/schema.ts

import { pgTable, text, timestamp, varchar, integer, boolean, index, jsonb, decimal } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

// Users table - Professionals (infirmières, aides-soignantes, etc.)
export const users = pgTable('users', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    
    // Authentication
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    emailVerifiedAt: timestamp('email_verified_at'),
    
    // Profile
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    
    // Professional information
    profession: varchar('profession', { length: 100 }), // 'infirmiere', 'aide_soignante', 'agent_entretien', 'aide_domicile', 'garde_enfants'
    adeliNumber: varchar('adeli_number', { length: 50 }), // Numéro ADELI pour infirmières
    agrementNumber: varchar('agrement_number', { length: 50 }), // Numéro d'agrément
    businessId: varchar('business_id', { length: 50 }), // Numéro SIRET (France), NIF (Espagne), ou autre identifiant selon le pays
    
    // Address
    address: text('address'),
    city: varchar('city', { length: 100 }),
    postalCode: varchar('postal_code', { length: 10 }),
    country: varchar('country', { length: 100 }).default('France'),
    
    // Settings
    timezone: varchar('timezone', { length: 50 }).default('Europe/Paris'),
    language: varchar('language', { length: 10 }).default('fr'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
}, (table) => [
    index('user_email_idx').on(table.email),
    index('user_profession_idx').on(table.profession),
    index('user_business_id_idx').on(table.businessId), // For business ID lookups
    index('user_country_idx').on(table.country), // For country-based queries
    index('user_created_at_idx').on(table.createdAt), // For user analytics
    index('user_first_name_idx').on(table.firstName), // For consultant search
    index('user_last_name_idx').on(table.lastName), // For consultant search
    index('user_city_idx').on(table.city), // For consultant search
]);

// Admins table - Separate table for administrators
export const admins = pgTable('admins', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    
    // Authentication
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    emailVerified: boolean('email_verified').default(true).notNull(),
    emailVerifiedAt: timestamp('email_verified_at').defaultNow(),
    
    // Profile
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    
    // Admin permissions
    role: varchar('role', { length: 50 }).default('admin').notNull(), // 'admin', 'super_admin'
    permissions: jsonb('permissions'), // JSON object with specific permissions
    
    // Admin metadata
    grantedAt: timestamp('granted_at').defaultNow().notNull(),
    grantedBy: varchar('granted_by', { length: 128 }), // ID of admin who granted access (self-reference, handled at application level)
    isActive: boolean('is_active').default(true).notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
}, (table) => [
    index('admin_email_idx').on(table.email),
    index('admin_role_idx').on(table.role),
    index('admin_active_idx').on(table.isActive),
    index('admin_role_active_idx').on(table.role, table.isActive), // Composite for filtered queries
]);

// Clients table
export const clients = pgTable('clients', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Professional who owns this client
    
    // Contact information
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    
    // Address
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 10 }).notNull(),
    country: varchar('country', { length: 100 }).default('France'),
    latitude: decimal('latitude', { precision: 10, scale: 8 }), // For geocoding
    longitude: decimal('longitude', { precision: 11, scale: 8 }), // For geocoding
    
    // Medical/Service information
    notes: text('notes'), // General notes
    medicalNotes: text('medical_notes'), // Medical notes (for healthcare professionals)
    allergies: text('allergies'),
    emergencyContact: jsonb('emergency_contact'), // { name, phone, relationship }
    
    // Status
    isActive: boolean('is_active').default(true).notNull(),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('client_user_idx').on(table.userId),
    index('client_active_idx').on(table.isActive),
    index('client_city_idx').on(table.city),
    index('client_user_active_idx').on(table.userId, table.isActive), // Composite for filtered client lists
    index('client_postal_code_idx').on(table.postalCode), // For location-based queries
    index('client_name_idx').on(table.firstName, table.lastName), // For name searches
]);

// Services table - Types of services offered
export const services = pgTable('services', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    duration: integer('duration').notNull(), // Duration in minutes
    price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price per service
    category: varchar('category', { length: 100 }), // 'soins', 'entretien', 'garde', etc.
    
    isActive: boolean('is_active').default(true).notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('service_user_idx').on(table.userId),
    index('service_active_idx').on(table.isActive),
    index('service_user_active_idx').on(table.userId, table.isActive), // Composite for filtered service lists
    index('service_category_idx').on(table.category), // For category filtering
]);

// Appointments table - Rendez-vous/Visites
export const appointments = pgTable('appointments', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    clientId: varchar('client_id', { length: 128 }).notNull().references(() => clients.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    serviceId: varchar('service_id', { length: 128 }).references(() => services.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Optional service reference
    tourId: varchar('tour_id', { length: 128 }).references(() => tours.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Optional tour reference
    
    // Scheduling
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    duration: integer('duration').notNull(), // Duration in minutes
    
    // Service details
    serviceName: varchar('service_name', { length: 255 }), // Snapshot of service name
    notes: text('notes'),
    
    // Status
    status: varchar('status', { length: 50 }).notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled', 'no_show'
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
    
    // Pricing
    price: decimal('price', { precision: 10, scale: 2 }), // Price for this appointment
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('appointment_user_idx').on(table.userId),
    index('appointment_client_idx').on(table.clientId),
    index('appointment_tour_idx').on(table.tourId),
    index('appointment_start_time_idx').on(table.startTime),
    index('appointment_status_idx').on(table.status),
    // Composite indexes for common query patterns
    index('appointment_user_start_idx').on(table.userId, table.startTime), // For calendar views
    index('appointment_user_status_idx').on(table.userId, table.status), // For filtered appointment lists
    index('appointment_client_start_idx').on(table.clientId, table.startTime), // For client appointment history
    index('appointment_date_range_idx').on(table.startTime, table.endTime), // For date range queries
]);

// Tours table - Tournées (optimized routes)
export const tours = pgTable('tours', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    name: varchar('name', { length: 255 }), // e.g., "Tournée du matin - Lundi"
    date: timestamp('date').notNull(), // Date of the tour
    
    // Optimization data
    optimizedOrder: jsonb('optimized_order'), // Array of appointment IDs in optimized order
    totalDistance: decimal('total_distance', { precision: 10, scale: 2 }), // Total distance in km
    estimatedDuration: integer('estimated_duration'), // Total estimated duration in minutes
    
    // Status
    status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft', 'scheduled', 'in_progress', 'completed'
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    
    notes: text('notes'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('tour_user_idx').on(table.userId),
    index('tour_date_idx').on(table.date),
    index('tour_status_idx').on(table.status),
    // Composite indexes for common query patterns
    index('tour_user_date_idx').on(table.userId, table.date), // For date-specific tour queries
    index('tour_user_status_idx').on(table.userId, table.status), // For filtered tour lists
]);

// Invoices table
export const invoices = pgTable('invoices', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    clientId: varchar('client_id', { length: 128 }).notNull().references(() => clients.id, { onDelete: 'restrict', onUpdate: 'cascade' }), // Restrict deletion if invoices exist
    
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    
    // Dates
    issueDate: timestamp('issue_date').notNull(),
    dueDate: timestamp('due_date'),
    
    // Amounts
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    tax: decimal('tax', { precision: 10, scale: 2 }).default('0.00').notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    
    // Status
    status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    paidAt: timestamp('paid_at'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    
    // Notes
    notes: text('notes'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('invoice_user_idx').on(table.userId),
    index('invoice_client_idx').on(table.clientId),
    index('invoice_number_idx').on(table.invoiceNumber),
    index('invoice_status_idx').on(table.status),
    index('invoice_issue_date_idx').on(table.issueDate),
    // Composite indexes for common query patterns
    index('invoice_user_status_idx').on(table.userId, table.status), // For filtered invoice lists
    index('invoice_user_date_idx').on(table.userId, table.issueDate), // For date range queries
    index('invoice_client_status_idx').on(table.clientId, table.status), // For client invoice history
]);

// Invoice items table
export const invoiceItems = pgTable('invoice_items', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    invoiceId: varchar('invoice_id', { length: 128 }).notNull().references(() => invoices.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    appointmentId: varchar('appointment_id', { length: 128 }).references(() => appointments.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Optional reference to appointment
    
    description: text('description').notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1.00'),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('invoice_item_invoice_idx').on(table.invoiceId),
    index('invoice_item_appointment_idx').on(table.appointmentId),
]);

// Documents table
export const documents = pgTable('documents', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    clientId: varchar('client_id', { length: 128 }).references(() => clients.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Optional - can be general document
    
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }), // 'contract', 'note', 'certificate', 'prescription', etc.
    fileUrl: text('file_url').notNull(), // URL to stored file
    fileSize: integer('file_size'), // Size in bytes
    mimeType: varchar('mime_type', { length: 100 }),
    
    description: text('description'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('document_user_idx').on(table.userId),
    index('document_client_idx').on(table.clientId),
    index('document_type_idx').on(table.type),
    index('document_user_type_idx').on(table.userId, table.type), // Composite for filtered document lists
]);

// Job Offers table - Offres de mission
export const jobOffers = pgTable('job_offers', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    clientId: varchar('client_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Le professionnel qui envoie l'offre
    workerId: varchar('worker_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Le travailleur destinataire
    
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 10 }).notNull(),
    country: varchar('country', { length: 100 }).default('France'),
    
    serviceType: varchar('service_type', { length: 100 }), // Type de service requis
    compensation: decimal('compensation', { precision: 10, scale: 2 }), // Rémunération proposée
    notes: text('notes'), // Notes supplémentaires
    
    status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'accepted', 'declined', 'expired'
    respondedAt: timestamp('responded_at'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('job_offer_worker_idx').on(table.workerId),
    index('job_offer_client_idx').on(table.clientId),
    index('job_offer_status_idx').on(table.status),
    index('job_offer_worker_status_idx').on(table.workerId, table.status), // Composite pour les requêtes filtrées
    index('job_offer_client_status_idx').on(table.clientId, table.status),
    index('job_offer_dates_idx').on(table.startDate, table.endDate), // Pour les requêtes de plage de dates
]);

// Worker-Clients junction table - Relation many-to-many entre travailleurs et clients
export const workerClients = pgTable('worker_clients', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    workerId: varchar('worker_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    clientId: varchar('client_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Le professionnel client
    originalClientId: varchar('original_client_id', { length: 128 }).references(() => clients.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Si le client existait déjà dans la table clients
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('worker_client_worker_idx').on(table.workerId),
    index('worker_client_client_idx').on(table.clientId),
    index('worker_client_unique_idx').on(table.workerId, table.clientId), // Unique constraint pour éviter les doublons
]);

// Consultant Pools table - Catégories de consultants pour les entreprises
export const consultantPools = pgTable('consultant_pools', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    companyId: varchar('company_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // L'entreprise propriétaire
    name: varchar('name', { length: 255 }).notNull(), // Nom de la catégorie/pool
    color: varchar('color', { length: 50 }), // Couleur optionnelle pour l'affichage
    description: text('description'), // Description optionnelle
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('pool_company_idx').on(table.companyId),
    index('pool_company_name_idx').on(table.companyId, table.name), // Pour les recherches par nom
]);

// Consultant-Pool junction table - Relation many-to-many entre consultants et pools
export const consultantPoolMembers = pgTable('consultant_pool_members', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    poolId: varchar('pool_id', { length: 128 }).notNull().references(() => consultantPools.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    consultantId: varchar('consultant_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Le consultant (worker)
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('pool_member_pool_idx').on(table.poolId),
    index('pool_member_consultant_idx').on(table.consultantId),
    index('pool_member_unique_idx').on(table.poolId, table.consultantId), // Unique constraint pour éviter les doublons
]);

// Settings table - User preferences
export const settings = pgTable('settings', {
    id: varchar('id', { length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar('user_id', { length: 128 }).notNull().unique().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    // Notification preferences
    emailNotifications: boolean('email_notifications').default(true).notNull(),
    smsNotifications: boolean('sms_notifications').default(false).notNull(),
    reminderBeforeAppointment: integer('reminder_before_appointment').default(30), // Minutes before
    
    // Business preferences
    defaultServiceDuration: integer('default_service_duration').default(60), // Minutes
    workingHours: jsonb('working_hours'), // { monday: { start: '09:00', end: '18:00' }, ... }
    currency: varchar('currency', { length: 10 }).default('EUR'),
    taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0.00'),
    
    // Other preferences
    preferences: jsonb('preferences'), // Flexible JSON for other settings
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('settings_user_idx').on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    clients: many(clients),
    appointments: many(appointments),
    tours: many(tours),
    invoices: many(invoices),
    services: many(services),
    documents: many(documents),
    settings: many(settings),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
    user: one(users, {
        fields: [clients.userId],
        references: [users.id],
    }),
    appointments: many(appointments),
    invoices: many(invoices),
    documents: many(documents),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
    user: one(users, {
        fields: [services.userId],
        references: [users.id],
    }),
    appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
    user: one(users, {
        fields: [appointments.userId],
        references: [users.id],
    }),
    client: one(clients, {
        fields: [appointments.clientId],
        references: [clients.id],
    }),
    service: one(services, {
        fields: [appointments.serviceId],
        references: [services.id],
    }),
    tour: one(tours, {
        fields: [appointments.tourId],
        references: [tours.id],
    }),
    invoiceItems: many(invoiceItems),
}));

export const toursRelations = relations(tours, ({ one, many }) => ({
    user: one(users, {
        fields: [tours.userId],
        references: [users.id],
    }),
    appointments: many(appointments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    user: one(users, {
        fields: [invoices.userId],
        references: [users.id],
    }),
    client: one(clients, {
        fields: [invoices.clientId],
        references: [clients.id],
    }),
    items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
    invoice: one(invoices, {
        fields: [invoiceItems.invoiceId],
        references: [invoices.id],
    }),
    appointment: one(appointments, {
        fields: [invoiceItems.appointmentId],
        references: [appointments.id],
    }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
    user: one(users, {
        fields: [documents.userId],
        references: [users.id],
    }),
    client: one(clients, {
        fields: [documents.clientId],
        references: [clients.id],
    }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
    user: one(users, {
        fields: [settings.userId],
        references: [users.id],
    }),
}));

export const jobOffersRelations = relations(jobOffers, ({ one }) => ({
    client: one(users, {
        fields: [jobOffers.clientId],
        references: [users.id],
        relationName: 'offerClient',
    }),
    worker: one(users, {
        fields: [jobOffers.workerId],
        references: [users.id],
        relationName: 'offerWorker',
    }),
}));

export const workerClientsRelations = relations(workerClients, ({ one }) => ({
    worker: one(users, {
        fields: [workerClients.workerId],
        references: [users.id],
        relationName: 'workerClientWorker',
    }),
    client: one(users, {
        fields: [workerClients.clientId],
        references: [users.id],
        relationName: 'workerClientClient',
    }),
    originalClient: one(clients, {
        fields: [workerClients.originalClientId],
        references: [clients.id],
    }),
}));

export const consultantPoolsRelations = relations(consultantPools, ({ one, many }) => ({
    company: one(users, {
        fields: [consultantPools.companyId],
        references: [users.id],
        relationName: 'poolCompany',
    }),
    members: many(consultantPoolMembers, {
        relationName: 'poolMembers',
    }),
}));

export const consultantPoolMembersRelations = relations(consultantPoolMembers, ({ one }) => ({
    pool: one(consultantPools, {
        fields: [consultantPoolMembers.poolId],
        references: [consultantPools.id],
        relationName: 'poolMembers',
    }),
    consultant: one(users, {
        fields: [consultantPoolMembers.consultantId],
        references: [users.id],
        relationName: 'poolMemberConsultant',
    }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type Tour = typeof tours.$inferSelect;
export type NewTour = typeof tours.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type JobOffer = typeof jobOffers.$inferSelect;
export type NewJobOffer = typeof jobOffers.$inferInsert;
export type WorkerClient = typeof workerClients.$inferSelect;
export type NewWorkerClient = typeof workerClients.$inferInsert;
export type ConsultantPool = typeof consultantPools.$inferSelect;
export type NewConsultantPool = typeof consultantPools.$inferInsert;
export type ConsultantPoolMember = typeof consultantPoolMembers.$inferSelect;
export type NewConsultantPoolMember = typeof consultantPoolMembers.$inferInsert;
