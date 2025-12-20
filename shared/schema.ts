import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  notes: text("notes"),
});

export const stoneSettingRates = pgTable("stone_setting_rates", {
  id: serial("id").primaryKey(),
  minCarat: decimal("min_carat", { precision: 6, scale: 4 }).notNull(),
  maxCarat: decimal("max_carat", { precision: 6, scale: 4 }).notNull(),
  pricePerStone: decimal("price_per_stone", { precision: 10, scale: 2 }).notNull(),
});

export const gemstonePriceLists = pgTable("gemstone_price_lists", {
  id: serial("id").primaryKey(),
  stoneType: text("stone_type").notNull(),
  quality: text("quality"),
  minCarat: decimal("min_carat", { precision: 6, scale: 4 }),
  maxCarat: decimal("max_carat", { precision: 6, scale: 4 }),
  pricePerCarat: decimal("price_per_carat", { precision: 10, scale: 2 }).notNull(),
});

export const analysisRecords = pgTable("analysis_records", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  productCode: text("product_code").notNull(),
  totalGrams: decimal("total_grams", { precision: 10, scale: 3 }).notNull(),
  goldPurity: text("gold_purity").default("24"),
  goldLaborCost: decimal("gold_labor_cost", { precision: 10, scale: 2 }),
  goldLaborType: text("gold_labor_type").default("dollar"),
  firePercentage: decimal("fire_percentage", { precision: 5, scale: 2 }),
  polishAmount: decimal("polish_amount", { precision: 10, scale: 2 }),
  certificateAmount: decimal("certificate_amount", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  manufacturerPrice: decimal("manufacturer_price", { precision: 12, scale: 2 }),
  rawMaterialCost: decimal("raw_material_cost", { precision: 12, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 12, scale: 2 }),
  totalSettingCost: decimal("total_setting_cost", { precision: 12, scale: 2 }),
  totalStoneCost: decimal("total_stone_cost", { precision: 12, scale: 2 }),
  profitLoss: decimal("profit_loss", { precision: 12, scale: 2 }),
  goldPriceUsed: decimal("gold_price_used", { precision: 12, scale: 2 }),
  usdTryUsed: decimal("usd_try_used", { precision: 10, scale: 4 }),
});

export const analysisStones = pgTable("analysis_stones", {
  id: serial("id").primaryKey(),
  analysisRecordId: integer("analysis_record_id").references(() => analysisRecords.id, { onDelete: "cascade" }).notNull(),
  stoneType: text("stone_type").notNull(),
  caratSize: decimal("carat_size", { precision: 6, scale: 4 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  pricePerCarat: decimal("price_per_carat", { precision: 10, scale: 2 }),
  shape: text("shape"),
  color: text("color"),
  clarity: text("clarity"),
  rapaportPrice: decimal("rapaport_price", { precision: 10, scale: 2 }),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
  settingCost: decimal("setting_cost", { precision: 10, scale: 2 }),
  totalStoneCost: decimal("total_stone_cost", { precision: 10, scale: 2 }),
});

export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  usdTry: decimal("usd_try", { precision: 10, scale: 4 }).notNull(),
  gold24kPerGram: decimal("gold_24k_per_gram", { precision: 12, scale: 2 }).notNull(),
  gold24kCurrency: text("gold_24k_currency").default("TRY"),
  isManual: boolean("is_manual").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rapaportPrices = pgTable("rapaport_prices", {
  id: serial("id").primaryKey(),
  shape: text("shape").notNull(),
  lowCarat: decimal("low_carat", { precision: 6, scale: 2 }).notNull(),
  highCarat: decimal("high_carat", { precision: 6, scale: 2 }).notNull(),
  color: text("color").notNull(),
  clarity: text("clarity").notNull(),
  pricePerCarat: decimal("price_per_carat", { precision: 10, scale: 2 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  analysisRecords: many(analysisRecords),
}));

export const analysisRecordsRelations = relations(analysisRecords, ({ one, many }) => ({
  manufacturer: one(manufacturers, {
    fields: [analysisRecords.manufacturerId],
    references: [manufacturers.id],
  }),
  stones: many(analysisStones),
}));

export const analysisStonesRelations = relations(analysisStones, ({ one }) => ({
  analysisRecord: one(analysisRecords, {
    fields: [analysisStones.analysisRecordId],
    references: [analysisRecords.id],
  }),
}));

export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({ id: true });
export const insertStoneSettingRateSchema = createInsertSchema(stoneSettingRates).omit({ id: true });
export const insertGemstonePriceListSchema = createInsertSchema(gemstonePriceLists).omit({ id: true });
export const insertAnalysisRecordSchema = createInsertSchema(analysisRecords).omit({ id: true });
export const insertAnalysisStoneSchema = createInsertSchema(analysisStones).omit({ id: true });
export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({ id: true, updatedAt: true });
export const insertRapaportPriceSchema = createInsertSchema(rapaportPrices).omit({ id: true, uploadedAt: true });

export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;

export type StoneSettingRate = typeof stoneSettingRates.$inferSelect;
export type InsertStoneSettingRate = z.infer<typeof insertStoneSettingRateSchema>;

export type GemstonePriceList = typeof gemstonePriceLists.$inferSelect;
export type InsertGemstonePriceList = z.infer<typeof insertGemstonePriceListSchema>;

export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type InsertAnalysisRecord = z.infer<typeof insertAnalysisRecordSchema>;

export type AnalysisStone = typeof analysisStones.$inferSelect;
export type InsertAnalysisStone = z.infer<typeof insertAnalysisStoneSchema>;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

export type RapaportPrice = typeof rapaportPrices.$inferSelect;
export type InsertRapaportPrice = z.infer<typeof insertRapaportPriceSchema>;

export type AnalysisRecordWithRelations = AnalysisRecord & {
  manufacturer?: Manufacturer | null;
  stones?: AnalysisStone[];
};
