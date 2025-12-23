import { 
  users,
  manufacturers, 
  stoneSettingRates, 
  gemstonePriceLists, 
  analysisRecords, 
  analysisStones,
  exchangeRates,
  rapaportPrices,
  rapaportDiscountRates,
  batches,
  adminSettings,
  type User,
  type InsertUser,
  type Manufacturer, 
  type InsertManufacturer,
  type StoneSettingRate,
  type InsertStoneSettingRate,
  type GemstonePriceList,
  type InsertGemstonePriceList,
  type AnalysisRecord,
  type InsertAnalysisRecord,
  type AnalysisStone,
  type InsertAnalysisStone,
  type AnalysisRecordWithRelations,
  type ExchangeRate,
  type InsertExchangeRate,
  type RapaportPrice,
  type InsertRapaportPrice,
  type RapaportDiscountRate,
  type InsertRapaportDiscountRate,
  type Batch,
  type InsertBatch,
  type BatchWithRelations,
  type AdminSettings,
  type InsertAdminSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(data: InsertUser & { passwordHash: string }): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser & { passwordHash?: string }>): Promise<User | undefined>;
  updateUserPassword(id: number, passwordHash: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  getManufacturers(): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  createManufacturer(data: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, data: Partial<InsertManufacturer>): Promise<Manufacturer | undefined>;
  deleteManufacturer(id: number): Promise<boolean>;

  getStoneSettingRates(): Promise<StoneSettingRate[]>;
  getStoneSettingRate(id: number): Promise<StoneSettingRate | undefined>;
  createStoneSettingRate(data: InsertStoneSettingRate): Promise<StoneSettingRate>;
  updateStoneSettingRate(id: number, data: Partial<InsertStoneSettingRate>): Promise<StoneSettingRate | undefined>;
  deleteStoneSettingRate(id: number): Promise<boolean>;

  getGemstonePriceLists(): Promise<GemstonePriceList[]>;
  getGemstonePriceList(id: number): Promise<GemstonePriceList | undefined>;
  createGemstonePriceList(data: InsertGemstonePriceList): Promise<GemstonePriceList>;
  updateGemstonePriceList(id: number, data: Partial<InsertGemstonePriceList>): Promise<GemstonePriceList | undefined>;
  deleteGemstonePriceList(id: number): Promise<boolean>;

  getAnalysisRecords(userId: number): Promise<AnalysisRecordWithRelations[]>;
  getAnalysisRecord(id: number, userId: number): Promise<AnalysisRecordWithRelations | undefined>;
  createAnalysisRecord(data: InsertAnalysisRecord & { userId: number }, stones: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord>;
  updateAnalysisRecord(id: number, userId: number, data: Partial<InsertAnalysisRecord>, stones?: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord | undefined>;
  deleteAnalysisRecord(id: number, userId: number): Promise<boolean>;

  getLatestExchangeRate(): Promise<ExchangeRate | undefined>;
  createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate>;
  
  getRapaportPrices(): Promise<RapaportPrice[]>;
  createRapaportPrice(data: InsertRapaportPrice): Promise<RapaportPrice>;
  createRapaportPrices(data: InsertRapaportPrice[]): Promise<RapaportPrice[]>;
  clearRapaportPrices(): Promise<void>;
  findRapaportPrice(shape: string, carat: number, color: string, clarity: string): Promise<RapaportPrice | undefined>;

  getBatches(userId: number): Promise<BatchWithRelations[]>;
  getBatchesByManufacturer(userId: number, manufacturerId: number): Promise<Batch[]>;
  getBatch(id: number, userId: number): Promise<BatchWithRelations | undefined>;
  getBatchWithFullDetails(id: number, userId: number): Promise<{ batch: BatchWithRelations; records: AnalysisRecordWithRelations[] } | undefined>;
  createBatch(userId: number, manufacturerId: number): Promise<Batch>;
  deleteBatch(id: number, userId: number): Promise<boolean>;
  getNextBatchNumber(userId: number, manufacturerId: number): Promise<number>;

  getRapaportDiscountRates(): Promise<RapaportDiscountRate[]>;
  getRapaportDiscountRate(id: number): Promise<RapaportDiscountRate | undefined>;
  createRapaportDiscountRate(data: InsertRapaportDiscountRate): Promise<RapaportDiscountRate>;
  updateRapaportDiscountRate(id: number, data: Partial<InsertRapaportDiscountRate>): Promise<RapaportDiscountRate | undefined>;
  deleteRapaportDiscountRate(id: number): Promise<boolean>;
  findRapaportDiscountRate(carat: number): Promise<RapaportDiscountRate | undefined>;

  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminSettings(data: InsertAdminSettings): Promise<AdminSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(data: InsertUser & { passwordHash: string }): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser & { passwordHash?: string }>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<boolean> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getManufacturers(): Promise<Manufacturer[]> {
    return db.select().from(manufacturers);
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id));
    return manufacturer || undefined;
  }

  async createManufacturer(data: InsertManufacturer): Promise<Manufacturer> {
    const [manufacturer] = await db.insert(manufacturers).values(data).returning();
    return manufacturer;
  }

  async updateManufacturer(id: number, data: Partial<InsertManufacturer>): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.update(manufacturers).set(data).where(eq(manufacturers.id, id)).returning();
    return manufacturer || undefined;
  }

  async deleteManufacturer(id: number): Promise<boolean> {
    const result = await db.delete(manufacturers).where(eq(manufacturers.id, id)).returning();
    return result.length > 0;
  }

  async getStoneSettingRates(): Promise<StoneSettingRate[]> {
    return db.select().from(stoneSettingRates);
  }

  async getStoneSettingRate(id: number): Promise<StoneSettingRate | undefined> {
    const [rate] = await db.select().from(stoneSettingRates).where(eq(stoneSettingRates.id, id));
    return rate || undefined;
  }

  async createStoneSettingRate(data: InsertStoneSettingRate): Promise<StoneSettingRate> {
    const [rate] = await db.insert(stoneSettingRates).values(data).returning();
    return rate;
  }

  async updateStoneSettingRate(id: number, data: Partial<InsertStoneSettingRate>): Promise<StoneSettingRate | undefined> {
    const [rate] = await db.update(stoneSettingRates).set(data).where(eq(stoneSettingRates.id, id)).returning();
    return rate || undefined;
  }

  async deleteStoneSettingRate(id: number): Promise<boolean> {
    const result = await db.delete(stoneSettingRates).where(eq(stoneSettingRates.id, id)).returning();
    return result.length > 0;
  }

  async getGemstonePriceLists(): Promise<GemstonePriceList[]> {
    return db.select().from(gemstonePriceLists);
  }

  async getGemstonePriceList(id: number): Promise<GemstonePriceList | undefined> {
    const [price] = await db.select().from(gemstonePriceLists).where(eq(gemstonePriceLists.id, id));
    return price || undefined;
  }

  async createGemstonePriceList(data: InsertGemstonePriceList): Promise<GemstonePriceList> {
    const [price] = await db.insert(gemstonePriceLists).values(data).returning();
    return price;
  }

  async updateGemstonePriceList(id: number, data: Partial<InsertGemstonePriceList>): Promise<GemstonePriceList | undefined> {
    const [price] = await db.update(gemstonePriceLists).set(data).where(eq(gemstonePriceLists.id, id)).returning();
    return price || undefined;
  }

  async deleteGemstonePriceList(id: number): Promise<boolean> {
    const result = await db.delete(gemstonePriceLists).where(eq(gemstonePriceLists.id, id)).returning();
    return result.length > 0;
  }

  async getAnalysisRecords(userId: number): Promise<AnalysisRecordWithRelations[]> {
    const records = await db.select().from(analysisRecords).where(eq(analysisRecords.userId, userId));
    const result: AnalysisRecordWithRelations[] = [];
    
    for (const record of records) {
      const manufacturer = record.manufacturerId 
        ? await this.getManufacturer(record.manufacturerId) 
        : null;
      const batch = record.batchId
        ? (await db.select().from(batches).where(eq(batches.id, record.batchId)))[0] || null
        : null;
      const stones = await db.select().from(analysisStones).where(eq(analysisStones.analysisRecordId, record.id));
      result.push({ ...record, manufacturer, batch, stones });
    }
    
    return result;
  }

  async getAnalysisRecord(id: number, userId: number): Promise<AnalysisRecordWithRelations | undefined> {
    const [record] = await db.select().from(analysisRecords).where(
      and(eq(analysisRecords.id, id), eq(analysisRecords.userId, userId))
    );
    if (!record) return undefined;

    const manufacturer = record.manufacturerId 
      ? await this.getManufacturer(record.manufacturerId) 
      : null;
    const batch = record.batchId
      ? (await db.select().from(batches).where(eq(batches.id, record.batchId)))[0] || null
      : null;
    const stones = await db.select().from(analysisStones).where(eq(analysisStones.analysisRecordId, record.id));
    
    return { ...record, manufacturer, batch, stones };
  }

  async createAnalysisRecord(data: InsertAnalysisRecord & { userId: number }, stonesData: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord> {
    // Frontend'den gelen totalCost değerini kullan (doğru hesaplanmış değer)
    const [record] = await db.insert(analysisRecords).values({
      ...data,
    }).returning();

    if (stonesData.length > 0) {
      await db.insert(analysisStones).values(
        stonesData.map(stone => ({
          ...stone,
          analysisRecordId: record.id,
        }))
      );
    }

    return record;
  }

  async updateAnalysisRecord(id: number, userId: number, data: Partial<InsertAnalysisRecord>, stonesData?: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord | undefined> {
    const existing = await this.getAnalysisRecord(id, userId);
    if (!existing) return undefined;

    const mergedData = {
      manufacturerId: data.manufacturerId !== undefined ? data.manufacturerId : existing.manufacturerId,
      batchId: data.batchId !== undefined ? data.batchId : existing.batchId,
      productCode: data.productCode !== undefined ? data.productCode : existing.productCode,
      productType: data.productType !== undefined ? data.productType : existing.productType,
      totalGrams: data.totalGrams !== undefined ? data.totalGrams : existing.totalGrams,
      goldPurity: data.goldPurity !== undefined ? data.goldPurity : existing.goldPurity,
      goldLaborCost: data.goldLaborCost !== undefined ? data.goldLaborCost : existing.goldLaborCost,
      goldLaborType: data.goldLaborType !== undefined ? data.goldLaborType : existing.goldLaborType,
      firePercentage: data.firePercentage !== undefined ? data.firePercentage : existing.firePercentage,
      polishAmount: data.polishAmount !== undefined ? data.polishAmount : existing.polishAmount,
      certificateAmount: data.certificateAmount !== undefined ? data.certificateAmount : existing.certificateAmount,
      manufacturerPrice: data.manufacturerPrice !== undefined ? data.manufacturerPrice : existing.manufacturerPrice,
      rawMaterialCost: data.rawMaterialCost !== undefined ? data.rawMaterialCost : existing.rawMaterialCost,
      laborCost: data.laborCost !== undefined ? data.laborCost : existing.laborCost,
      totalSettingCost: data.totalSettingCost !== undefined ? data.totalSettingCost : existing.totalSettingCost,
      totalStoneCost: data.totalStoneCost !== undefined ? data.totalStoneCost : existing.totalStoneCost,
      totalCost: data.totalCost !== undefined ? data.totalCost : existing.totalCost,
      profitLoss: data.profitLoss !== undefined ? data.profitLoss : existing.profitLoss,
      goldPriceUsed: data.goldPriceUsed !== undefined ? data.goldPriceUsed : existing.goldPriceUsed,
      usdTryUsed: data.usdTryUsed !== undefined ? data.usdTryUsed : existing.usdTryUsed,
    };

    if (stonesData !== undefined) {
      await db.delete(analysisStones).where(eq(analysisStones.analysisRecordId, id));

      if (stonesData.length > 0) {
        await db.insert(analysisStones).values(
          stonesData.map(stone => ({
            ...stone,
            analysisRecordId: id,
          }))
        );
      }
    }

    // Frontend'den gelen totalCost değerini kullan (doğru hesaplanmış değer)
    const [record] = await db.update(analysisRecords).set({
      ...mergedData,
    }).where(
      and(eq(analysisRecords.id, id), eq(analysisRecords.userId, userId))
    ).returning();

    return record || undefined;
  }

  async deleteAnalysisRecord(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(analysisRecords).where(
      and(eq(analysisRecords.id, id), eq(analysisRecords.userId, userId))
    ).returning();
    return result.length > 0;
  }

  async getLatestExchangeRate(): Promise<ExchangeRate | undefined> {
    const [rate] = await db.select().from(exchangeRates)
      .orderBy(desc(exchangeRates.updatedAt))
      .limit(1);
    return rate || undefined;
  }

  async createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate> {
    const [rate] = await db.insert(exchangeRates).values(data).returning();
    return rate;
  }

  async getRapaportPrices(): Promise<RapaportPrice[]> {
    return db.select().from(rapaportPrices);
  }

  async createRapaportPrice(data: InsertRapaportPrice): Promise<RapaportPrice> {
    const [price] = await db.insert(rapaportPrices).values(data).returning();
    return price;
  }

  async createRapaportPrices(data: InsertRapaportPrice[]): Promise<RapaportPrice[]> {
    if (data.length === 0) return [];
    const results = await db.insert(rapaportPrices).values(data).returning();
    return results;
  }

  async clearRapaportPrices(): Promise<void> {
    await db.delete(rapaportPrices);
  }

  async findRapaportPrice(shape: string, carat: number, color: string, clarity: string): Promise<RapaportPrice | undefined> {
    const caratStr = carat.toString();
    const [price] = await db.select().from(rapaportPrices).where(
      and(
        eq(rapaportPrices.shape, shape),
        eq(rapaportPrices.color, color),
        eq(rapaportPrices.clarity, clarity),
        lte(rapaportPrices.lowCarat, caratStr),
        gte(rapaportPrices.highCarat, caratStr)
      )
    );
    return price || undefined;
  }

  async getBatches(userId: number): Promise<BatchWithRelations[]> {
    const allBatches = await db.select().from(batches)
      .where(eq(batches.userId, userId))
      .orderBy(desc(batches.createdAt));
    const result: BatchWithRelations[] = [];
    
    for (const batch of allBatches) {
      const manufacturer = await this.getManufacturer(batch.manufacturerId);
      const records = await db.select().from(analysisRecords).where(eq(analysisRecords.batchId, batch.id));
      result.push({ ...batch, manufacturer, analysisRecords: records });
    }
    
    return result;
  }

  async getBatchesByManufacturer(userId: number, manufacturerId: number): Promise<Batch[]> {
    return db.select().from(batches)
      .where(and(eq(batches.userId, userId), eq(batches.manufacturerId, manufacturerId)))
      .orderBy(desc(batches.batchNumber));
  }

  async getBatch(id: number, userId: number): Promise<BatchWithRelations | undefined> {
    const [batch] = await db.select().from(batches).where(
      and(eq(batches.id, id), eq(batches.userId, userId))
    );
    if (!batch) return undefined;

    const manufacturer = await this.getManufacturer(batch.manufacturerId);
    const records = await db.select().from(analysisRecords).where(eq(analysisRecords.batchId, batch.id));
    
    return { ...batch, manufacturer, analysisRecords: records };
  }

  async getBatchWithFullDetails(id: number, userId: number): Promise<{ batch: BatchWithRelations; records: AnalysisRecordWithRelations[] } | undefined> {
    const [batch] = await db.select().from(batches).where(
      and(eq(batches.id, id), eq(batches.userId, userId))
    );
    if (!batch) return undefined;

    const manufacturer = await this.getManufacturer(batch.manufacturerId);
    const batchRecords = await db.select().from(analysisRecords).where(eq(analysisRecords.batchId, batch.id));
    
    const recordsWithStones: AnalysisRecordWithRelations[] = [];
    for (const record of batchRecords) {
      const stones = await db.select().from(analysisStones).where(eq(analysisStones.analysisRecordId, record.id));
      recordsWithStones.push({ ...record, manufacturer, stones });
    }
    
    return { 
      batch: { ...batch, manufacturer, analysisRecords: batchRecords },
      records: recordsWithStones 
    };
  }

  async getNextBatchNumber(userId: number, manufacturerId: number): Promise<number> {
    const existingBatches = await db.select().from(batches)
      .where(and(eq(batches.userId, userId), eq(batches.manufacturerId, manufacturerId)))
      .orderBy(desc(batches.batchNumber))
      .limit(1);
    
    if (existingBatches.length === 0) {
      return 1;
    }
    return existingBatches[0].batchNumber + 1;
  }

  async createBatch(userId: number, manufacturerId: number): Promise<Batch> {
    const nextNumber = await this.getNextBatchNumber(userId, manufacturerId);
    const [batch] = await db.insert(batches).values({
      userId,
      manufacturerId,
      batchNumber: nextNumber,
    }).returning();
    return batch;
  }

  async deleteBatch(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(batches).where(
      and(eq(batches.id, id), eq(batches.userId, userId))
    ).returning();
    return result.length > 0;
  }

  async getRapaportDiscountRates(): Promise<RapaportDiscountRate[]> {
    return db.select().from(rapaportDiscountRates);
  }

  async getRapaportDiscountRate(id: number): Promise<RapaportDiscountRate | undefined> {
    const [rate] = await db.select().from(rapaportDiscountRates).where(eq(rapaportDiscountRates.id, id));
    return rate || undefined;
  }

  async createRapaportDiscountRate(data: InsertRapaportDiscountRate): Promise<RapaportDiscountRate> {
    const [rate] = await db.insert(rapaportDiscountRates).values(data).returning();
    return rate;
  }

  async updateRapaportDiscountRate(id: number, data: Partial<InsertRapaportDiscountRate>): Promise<RapaportDiscountRate | undefined> {
    const [rate] = await db.update(rapaportDiscountRates).set(data).where(eq(rapaportDiscountRates.id, id)).returning();
    return rate || undefined;
  }

  async deleteRapaportDiscountRate(id: number): Promise<boolean> {
    const result = await db.delete(rapaportDiscountRates).where(eq(rapaportDiscountRates.id, id)).returning();
    return result.length > 0;
  }

  async findRapaportDiscountRate(carat: number): Promise<RapaportDiscountRate | undefined> {
    const caratStr = carat.toString();
    const [rate] = await db.select().from(rapaportDiscountRates)
      .where(and(
        lte(rapaportDiscountRates.minCarat, caratStr),
        gte(rapaportDiscountRates.maxCarat, caratStr)
      ));
    return rate || undefined;
  }

  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings);
    return settings || undefined;
  }

  async updateAdminSettings(data: InsertAdminSettings): Promise<AdminSettings> {
    const existing = await this.getAdminSettings();
    if (existing) {
      const [updated] = await db.update(adminSettings).set({
        ...data,
        updatedAt: new Date(),
      }).where(eq(adminSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(adminSettings).values(data).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
