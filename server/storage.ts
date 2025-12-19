import { 
  manufacturers, 
  stoneSettingRates, 
  gemstonePriceLists, 
  analysisRecords, 
  analysisStones,
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
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
