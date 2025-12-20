import { 
  manufacturers, 
  stoneSettingRates, 
  gemstonePriceLists, 
  analysisRecords, 
  analysisStones,
  exchangeRates,
  rapaportPrices,
  batches,
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
  type Batch,
  type InsertBatch,
  type BatchWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
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

  getAnalysisRecords(): Promise<AnalysisRecordWithRelations[]>;
  getAnalysisRecord(id: number): Promise<AnalysisRecordWithRelations | undefined>;
  createAnalysisRecord(data: InsertAnalysisRecord, stones: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord>;
  updateAnalysisRecord(id: number, data: Partial<InsertAnalysisRecord>, stones?: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord | undefined>;
  deleteAnalysisRecord(id: number): Promise<boolean>;

  getLatestExchangeRate(): Promise<ExchangeRate | undefined>;
  createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate>;
  
  getRapaportPrices(): Promise<RapaportPrice[]>;
  createRapaportPrice(data: InsertRapaportPrice): Promise<RapaportPrice>;
  createRapaportPrices(data: InsertRapaportPrice[]): Promise<RapaportPrice[]>;
  clearRapaportPrices(): Promise<void>;
  findRapaportPrice(shape: string, carat: number, color: string, clarity: string): Promise<RapaportPrice | undefined>;

  getBatches(): Promise<BatchWithRelations[]>;
  getBatchesByManufacturer(manufacturerId: number): Promise<Batch[]>;
  getBatch(id: number): Promise<BatchWithRelations | undefined>;
  getBatchWithFullDetails(id: number): Promise<{ batch: BatchWithRelations; records: AnalysisRecordWithRelations[] } | undefined>;
  createBatch(manufacturerId: number): Promise<Batch>;
  deleteBatch(id: number): Promise<boolean>;
  getNextBatchNumber(manufacturerId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
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

  async getAnalysisRecords(): Promise<AnalysisRecordWithRelations[]> {
    const records = await db.select().from(analysisRecords);
    const result: AnalysisRecordWithRelations[] = [];
    
    for (const record of records) {
      const manufacturer = record.manufacturerId 
        ? await this.getManufacturer(record.manufacturerId) 
        : null;
      const stones = await db.select().from(analysisStones).where(eq(analysisStones.analysisRecordId, record.id));
      result.push({ ...record, manufacturer, stones });
    }
    
    return result;
  }

  async getAnalysisRecord(id: number): Promise<AnalysisRecordWithRelations | undefined> {
    const [record] = await db.select().from(analysisRecords).where(eq(analysisRecords.id, id));
    if (!record) return undefined;

    const manufacturer = record.manufacturerId 
      ? await this.getManufacturer(record.manufacturerId) 
      : null;
    const stones = await db.select().from(analysisStones).where(eq(analysisStones.analysisRecordId, record.id));
    
    return { ...record, manufacturer, stones };
  }

  async createAnalysisRecord(data: InsertAnalysisRecord, stonesData: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord> {
    let totalStoneCost = 0;
    for (const stone of stonesData) {
      totalStoneCost += parseFloat(stone.totalStoneCost || "0");
    }

    const goldLabor = parseFloat(data.goldLaborCost || "0");
    const polish = parseFloat(data.polishAmount || "0");
    const certificate = parseFloat(data.certificateAmount || "0");
    const fire = parseFloat(data.firePercentage || "0");
    
    const baseTotal = goldLabor + polish + certificate + totalStoneCost;
    const fireAmount = baseTotal * (fire / 100);
    const totalCost = baseTotal + fireAmount;

    const [record] = await db.insert(analysisRecords).values({
      ...data,
      totalCost: totalCost.toFixed(2),
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

  async updateAnalysisRecord(id: number, data: Partial<InsertAnalysisRecord>, stonesData?: Omit<InsertAnalysisStone, 'analysisRecordId'>[]): Promise<AnalysisRecord | undefined> {
    const existing = await this.getAnalysisRecord(id);
    if (!existing) return undefined;

    const mergedData = {
      manufacturerId: data.manufacturerId !== undefined ? data.manufacturerId : existing.manufacturerId,
      productCode: data.productCode !== undefined ? data.productCode : existing.productCode,
      totalGrams: data.totalGrams !== undefined ? data.totalGrams : existing.totalGrams,
      goldPurity: data.goldPurity !== undefined ? data.goldPurity : existing.goldPurity,
      goldLaborCost: data.goldLaborCost !== undefined ? data.goldLaborCost : existing.goldLaborCost,
      goldLaborType: data.goldLaborType !== undefined ? data.goldLaborType : existing.goldLaborType,
      firePercentage: data.firePercentage !== undefined ? data.firePercentage : existing.firePercentage,
      polishAmount: data.polishAmount !== undefined ? data.polishAmount : existing.polishAmount,
      certificateAmount: data.certificateAmount !== undefined ? data.certificateAmount : existing.certificateAmount,
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

    const existingStones = stonesData !== undefined 
      ? stonesData 
      : existing.stones || [];
    
    let totalStoneCost = 0;
    for (const stone of existingStones) {
      totalStoneCost += parseFloat(stone.totalStoneCost || "0");
    }

    const goldLabor = parseFloat(mergedData.goldLaborCost || "0");
    const polish = parseFloat(mergedData.polishAmount || "0");
    const certificate = parseFloat(mergedData.certificateAmount || "0");
    const fire = parseFloat(mergedData.firePercentage || "0");
    
    const baseTotal = goldLabor + polish + certificate + totalStoneCost;
    const fireAmount = baseTotal * (fire / 100);
    const totalCost = baseTotal + fireAmount;

    const [record] = await db.update(analysisRecords).set({
      ...mergedData,
      totalCost: totalCost.toFixed(2),
    }).where(eq(analysisRecords.id, id)).returning();

    return record || undefined;
  }

  async deleteAnalysisRecord(id: number): Promise<boolean> {
    const result = await db.delete(analysisRecords).where(eq(analysisRecords.id, id)).returning();
    return result.length > 0;
  }

  async getLatestExchangeRate(): Promise<ExchangeRate | undefined> {
    const [rate] = await db.select().from(exchangeRates).orderBy(desc(exchangeRates.updatedAt)).limit(1);
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

  async getBatches(): Promise<BatchWithRelations[]> {
    const allBatches = await db.select().from(batches).orderBy(desc(batches.createdAt));
    const result: BatchWithRelations[] = [];
    
    for (const batch of allBatches) {
      const manufacturer = await this.getManufacturer(batch.manufacturerId);
      const records = await db.select().from(analysisRecords).where(eq(analysisRecords.batchId, batch.id));
      result.push({ ...batch, manufacturer, analysisRecords: records });
    }
    
    return result;
  }

  async getBatchesByManufacturer(manufacturerId: number): Promise<Batch[]> {
    return db.select().from(batches)
      .where(eq(batches.manufacturerId, manufacturerId))
      .orderBy(desc(batches.batchNumber));
  }

  async getBatch(id: number): Promise<BatchWithRelations | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    if (!batch) return undefined;

    const manufacturer = await this.getManufacturer(batch.manufacturerId);
    const records = await db.select().from(analysisRecords).where(eq(analysisRecords.batchId, batch.id));
    
    return { ...batch, manufacturer, analysisRecords: records };
  }

  async getBatchWithFullDetails(id: number): Promise<{ batch: BatchWithRelations; records: AnalysisRecordWithRelations[] } | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
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

  async getNextBatchNumber(manufacturerId: number): Promise<number> {
    const existingBatches = await db.select().from(batches)
      .where(eq(batches.manufacturerId, manufacturerId))
      .orderBy(desc(batches.batchNumber))
      .limit(1);
    
    if (existingBatches.length === 0) {
      return 1;
    }
    return existingBatches[0].batchNumber + 1;
  }

  async createBatch(manufacturerId: number): Promise<Batch> {
    const nextNumber = await this.getNextBatchNumber(manufacturerId);
    const [batch] = await db.insert(batches).values({
      manufacturerId,
      batchNumber: nextNumber,
    }).returning();
    return batch;
  }

  async deleteBatch(id: number): Promise<boolean> {
    const result = await db.delete(batches).where(eq(batches.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
