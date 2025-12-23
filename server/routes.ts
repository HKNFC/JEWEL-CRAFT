import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertManufacturerSchema,
  insertStoneSettingRateSchema,
  insertGemstonePriceListSchema,
  insertAnalysisRecordSchema,
  insertExchangeRateSchema,
  insertBatchSchema,
  insertRapaportDiscountRateSchema,
  insertUserSchema,
} from "@shared/schema";
import { fetchGoldPrices } from "./goldapi";
import { Resend } from "resend";
import bcrypt from "bcrypt";
import { z } from "zod";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
  }
  next();
};

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekiyor" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const registerSchema = insertUserSchema.extend({
        password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
      });
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const { password, ...userData } = parsed.data;
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanılıyor" });
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ ...userData, passwordHash });
      
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Kullanıcı oluşturulurken bir hata oluştu" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ passwordHash, ...u }) => u);
      res.json(safeUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Kullanıcılar alınırken bir hata oluştu" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (userId === req.session.userId) {
        return res.status(400).json({ error: "Kendi hesabınızı silemezsiniz" });
      }
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Kullanıcı silinirken bir hata oluştu" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Geçersiz kullanıcı adı veya şifre" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Geçersiz kullanıcı adı veya şifre" });
      }
      
      req.session.userId = user.id;
      
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Giriş sırasında bir hata oluştu" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Çıkış yapılırken bir hata oluştu" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Oturum bulunamadı" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Kullanıcı bulunamadı" });
    }
    
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const { companyName, fullName, email, emailFromAddress, gender } = req.body;
      const user = await storage.updateUser(req.session.userId!, {
        companyName,
        fullName,
        email,
        emailFromAddress,
        gender,
      });
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Profil güncellenirken bir hata oluştu" });
    }
  });

  app.patch("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Mevcut şifre ve yeni şifre gerekli" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalı" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Mevcut şifre hatalı" });
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.session.userId!, { passwordHash });
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Şifre değiştirilirken bir hata oluştu" });
    }
  });

  app.patch("/api/auth/email-api-key", requireAuth, async (req, res) => {
    try {
      const { emailApiKey } = req.body;
      const user = await storage.updateUser(req.session.userId!, { emailApiKey });
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "API anahtarı güncellenirken bir hata oluştu" });
    }
  });

  app.get("/api/manufacturers", requireAuth, async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manufacturers" });
    }
  });

  app.get("/api/manufacturers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await storage.getManufacturer(id);
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" });
      }
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manufacturer" });
    }
  });

  app.post("/api/manufacturers", requireAuth, async (req, res) => {
    try {
      const parsed = insertManufacturerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const manufacturer = await storage.createManufacturer(parsed.data);
      res.status(201).json(manufacturer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create manufacturer" });
    }
  });

  app.patch("/api/manufacturers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await storage.updateManufacturer(id, req.body);
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" });
      }
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update manufacturer" });
    }
  });

  app.delete("/api/manufacturers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteManufacturer(id);
      if (!deleted) {
        return res.status(404).json({ error: "Manufacturer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete manufacturer" });
    }
  });

  app.get("/api/stone-setting-rates", requireAuth, async (req, res) => {
    try {
      const rates = await storage.getStoneSettingRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stone setting rates" });
    }
  });

  app.get("/api/stone-setting-rates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rate = await storage.getStoneSettingRate(id);
      if (!rate) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rate" });
    }
  });

  app.post("/api/stone-setting-rates", requireAuth, async (req, res) => {
    try {
      const parsed = insertStoneSettingRateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const rate = await storage.createStoneSettingRate(parsed.data);
      res.status(201).json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to create rate" });
    }
  });

  app.patch("/api/stone-setting-rates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rate = await storage.updateStoneSettingRate(id, req.body);
      if (!rate) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rate" });
    }
  });

  app.delete("/api/stone-setting-rates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStoneSettingRate(id);
      if (!deleted) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rate" });
    }
  });

  app.get("/api/gemstone-prices", requireAuth, async (req, res) => {
    try {
      const prices = await storage.getGemstonePriceLists();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gemstone prices" });
    }
  });

  app.get("/api/gemstone-prices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const price = await storage.getGemstonePriceList(id);
      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }
      res.json(price);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  app.post("/api/gemstone-prices", requireAuth, async (req, res) => {
    try {
      const parsed = insertGemstonePriceListSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const price = await storage.createGemstonePriceList(parsed.data);
      res.status(201).json(price);
    } catch (error) {
      res.status(500).json({ error: "Failed to create price" });
    }
  });

  app.patch("/api/gemstone-prices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const price = await storage.updateGemstonePriceList(id, req.body);
      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }
      res.json(price);
    } catch (error) {
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  app.delete("/api/gemstone-prices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGemstonePriceList(id);
      if (!deleted) {
        return res.status(404).json({ error: "Price not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete price" });
    }
  });

  app.get("/api/analysis-records", requireAuth, async (req, res) => {
    try {
      const records = await storage.getAnalysisRecords(req.session.userId!);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis records" });
    }
  });

  app.get("/api/analysis-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getAnalysisRecord(id, req.session.userId!);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch record" });
    }
  });

  app.post("/api/analysis-records", requireAuth, async (req, res) => {
    try {
      const { stones, ...recordData } = req.body;
      const toNullIfEmpty = (val: any) => (val === "" || val === undefined) ? null : val;
      const parsed = insertAnalysisRecordSchema.safeParse({
        ...recordData,
        userId: req.session.userId!,
        manufacturerId: recordData.manufacturerId ? parseInt(recordData.manufacturerId) : null,
        goldPurity: recordData.goldPurity || "24",
        goldLaborCost: toNullIfEmpty(recordData.goldLaborCost),
        firePercentage: toNullIfEmpty(recordData.firePercentage),
        polishAmount: toNullIfEmpty(recordData.polishAmount),
        certificateAmount: toNullIfEmpty(recordData.certificateAmount),
        manufacturerPrice: toNullIfEmpty(recordData.manufacturerPrice),
        rawMaterialCost: toNullIfEmpty(recordData.rawMaterialCost),
        laborCost: toNullIfEmpty(recordData.laborCost),
        totalSettingCost: toNullIfEmpty(recordData.totalSettingCost),
        totalStoneCost: toNullIfEmpty(recordData.totalStoneCost),
        totalCost: toNullIfEmpty(recordData.totalCost),
        profitLoss: toNullIfEmpty(recordData.profitLoss),
        goldPriceUsed: toNullIfEmpty(recordData.goldPriceUsed),
        usdTryUsed: toNullIfEmpty(recordData.usdTryUsed),
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const formattedStones = (stones || []).map((stone: any) => ({
        stoneType: stone.stoneType,
        caratSize: stone.caratSize?.toString(),
        quantity: stone.quantity,
        pricePerCarat: stone.pricePerCarat?.toString() || null,
        settingCost: stone.settingCost?.toString() || null,
        totalStoneCost: stone.totalStoneCost?.toString() || null,
        shape: stone.shape || null,
        color: stone.color || null,
        clarity: stone.clarity || null,
        rapaportPrice: stone.rapaportPrice?.toString() || null,
        discountPercent: stone.discountPercent?.toString() || null,
      }));
      const record = await storage.createAnalysisRecord(parsed.data, formattedStones);
      res.status(201).json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create record" });
    }
  });

  app.patch("/api/analysis-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stones, ...recordData } = req.body;
      const toNullIfEmpty = (val: any) => (val === "" || val === undefined) ? null : val;
      const formattedStones = stones ? stones.map((stone: any) => ({
        stoneType: stone.stoneType,
        caratSize: stone.caratSize?.toString(),
        quantity: stone.quantity,
        pricePerCarat: stone.pricePerCarat?.toString() || null,
        settingCost: stone.settingCost?.toString() || null,
        totalStoneCost: stone.totalStoneCost?.toString() || null,
        shape: stone.shape || null,
        color: stone.color || null,
        clarity: stone.clarity || null,
        rapaportPrice: stone.rapaportPrice?.toString() || null,
        discountPercent: stone.discountPercent?.toString() || null,
      })) : undefined;
      const record = await storage.updateAnalysisRecord(id, req.session.userId!, {
        ...recordData,
        manufacturerId: recordData.manufacturerId ? parseInt(recordData.manufacturerId) : null,
        batchId: recordData.batchId ? parseInt(recordData.batchId) : null,
        goldPurity: recordData.goldPurity || "24",
        goldLaborCost: toNullIfEmpty(recordData.goldLaborCost),
        firePercentage: toNullIfEmpty(recordData.firePercentage),
        polishAmount: toNullIfEmpty(recordData.polishAmount),
        certificateAmount: toNullIfEmpty(recordData.certificateAmount),
        manufacturerPrice: toNullIfEmpty(recordData.manufacturerPrice),
        rawMaterialCost: toNullIfEmpty(recordData.rawMaterialCost),
        laborCost: toNullIfEmpty(recordData.laborCost),
        totalSettingCost: toNullIfEmpty(recordData.totalSettingCost),
        totalStoneCost: toNullIfEmpty(recordData.totalStoneCost),
        totalCost: toNullIfEmpty(recordData.totalCost),
        profitLoss: toNullIfEmpty(recordData.profitLoss),
        goldPriceUsed: toNullIfEmpty(recordData.goldPriceUsed),
        usdTryUsed: toNullIfEmpty(recordData.usdTryUsed),
      }, formattedStones);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update record" });
    }
  });

  app.delete("/api/analysis-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnalysisRecord(id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  app.get("/api/exchange-rates/latest", requireAuth, async (req, res) => {
    try {
      const rate = await storage.getLatestExchangeRate();
      res.json(rate || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exchange rate" });
    }
  });

  app.post("/api/exchange-rates", requireAuth, async (req, res) => {
    try {
      const parsed = insertExchangeRateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const rate = await storage.createExchangeRate(parsed.data);
      res.status(201).json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to save exchange rate" });
    }
  });

  app.post("/api/exchange-rates/fetch", requireAuth, async (req, res) => {
    try {
      const apiKey = process.env.GOLDAPI_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GoldAPI key not configured" });
      }
      const data = await fetchGoldPrices(apiKey);
      const rate = await storage.createExchangeRate({
        usdTry: data.usdTry.toString(),
        gold24kPerGram: data.gold24kPerGram.toString(),
        gold24kCurrency: data.gold24kCurrency,
        isManual: false,
      });
      res.status(201).json(rate);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch exchange rates from API" });
    }
  });

  app.get("/api/rapaport-prices", requireAuth, async (req, res) => {
    try {
      const prices = await storage.getRapaportPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Rapaport prices" });
    }
  });

  app.post("/api/rapaport-prices", requireAuth, async (req, res) => {
    try {
      const { shape, lowCarat, highCarat, color, clarity, price } = req.body;
      const priceData = {
        shape,
        lowCarat: lowCarat?.toString(),
        highCarat: highCarat?.toString(),
        color,
        clarity,
        pricePerCarat: price?.toString(),
      };
      const saved = await storage.createRapaportPrice(priceData);
      res.status(201).json(saved);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save Rapaport price" });
    }
  });

  app.post("/api/rapaport-prices/upload", requireAuth, async (req, res) => {
    try {
      const { prices, clearExisting } = req.body;
      if (clearExisting) {
        await storage.clearRapaportPrices();
      }
      const saved = await storage.createRapaportPrices(prices);
      res.status(201).json(saved);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save Rapaport prices" });
    }
  });

  app.delete("/api/rapaport-prices", requireAuth, async (req, res) => {
    try {
      await storage.clearRapaportPrices();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear Rapaport prices" });
    }
  });

  app.get("/api/rapaport-prices/lookup", requireAuth, async (req, res) => {
    try {
      const { shape, carat, color, clarity } = req.query;
      if (!shape || !carat || !color || !clarity) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      const price = await storage.findRapaportPrice(
        shape as string,
        parseFloat(carat as string),
        color as string,
        clarity as string
      );
      res.json(price || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to lookup Rapaport price" });
    }
  });

  app.get("/api/batches", requireAuth, async (req, res) => {
    try {
      const batches = await storage.getBatches(req.session.userId!);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.get("/api/batches/manufacturer/:manufacturerId", requireAuth, async (req, res) => {
    try {
      const manufacturerId = parseInt(req.params.manufacturerId);
      const batches = await storage.getBatchesByManufacturer(req.session.userId!, manufacturerId);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches for manufacturer" });
    }
  });

  app.get("/api/batches/next-number/:manufacturerId", requireAuth, async (req, res) => {
    try {
      const manufacturerId = parseInt(req.params.manufacturerId);
      const nextNumber = await storage.getNextBatchNumber(req.session.userId!, manufacturerId);
      res.json({ nextNumber });
    } catch (error) {
      res.status(500).json({ error: "Failed to get next batch number" });
    }
  });

  app.get("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const batch = await storage.getBatch(id, req.session.userId!);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.json(batch);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  app.get("/api/batches/:id/details", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const details = await storage.getBatchWithFullDetails(id, req.session.userId!);
      if (!details) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch details" });
    }
  });

  app.post("/api/batches", requireAuth, async (req, res) => {
    try {
      const { manufacturerId } = req.body;
      if (!manufacturerId) {
        return res.status(400).json({ error: "manufacturerId is required" });
      }
      const batch = await storage.createBatch(req.session.userId!, parseInt(manufacturerId));
      res.status(201).json(batch);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.delete("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBatch(id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  app.get("/api/rapaport-discount-rates", requireAuth, async (req, res) => {
    try {
      const rates = await storage.getRapaportDiscountRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rapaport discount rates" });
    }
  });

  app.get("/api/rapaport-discount-rates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rate = await storage.getRapaportDiscountRate(id);
      if (!rate) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rate" });
    }
  });

  app.post("/api/rapaport-discount-rates", requireAuth, async (req, res) => {
    try {
      const parsed = insertRapaportDiscountRateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const rate = await storage.createRapaportDiscountRate(parsed.data);
      res.status(201).json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to create rate" });
    }
  });

  app.patch("/api/rapaport-discount-rates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rate = await storage.updateRapaportDiscountRate(id, req.body);
      if (!rate) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rate" });
    }
  });

  app.delete("/api/rapaport-discount-rates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRapaportDiscountRate(id);
      if (!deleted) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rate" });
    }
  });

  app.get("/api/rapaport-discount-rates/find/:carat", requireAuth, async (req, res) => {
    try {
      const carat = parseFloat(req.params.carat);
      const rate = await storage.findRapaportDiscountRate(carat);
      res.json(rate || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to find discount rate" });
    }
  });

  app.get("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings || { ownerEmail: null, ccEmails: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin settings" });
    }
  });

  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { ownerEmail, ccEmails } = req.body;
      const settings = await storage.updateAdminSettings({
        ownerEmail: ownerEmail || null,
        ccEmails: ccEmails || [],
      });
      res.json(settings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update admin settings" });
    }
  });

  app.post("/api/send-batch-report", requireAuth, async (req, res) => {
    try {
      const { batchId, email, subject, htmlContent } = req.body;
      
      if (!email || !subject || !htmlContent) {
        return res.status(400).json({ error: "Email, subject, and htmlContent are required" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ error: "Kullanıcı bulunamadı" });
      }

      const apiKey = user.emailApiKey || process.env.RESEND_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Email API anahtarı ayarlanmamış. Lütfen Ayarlar sayfasından API anahtarınızı girin." });
      }

      const adminSettings = await storage.getAdminSettings();
      const ccList: string[] = [];
      if (adminSettings?.ownerEmail) {
        ccList.push(adminSettings.ownerEmail);
      }
      if (adminSettings?.ccEmails && adminSettings.ccEmails.length > 0) {
        ccList.push(...adminSettings.ccEmails);
      }

      const resend = new Resend(apiKey);
      const fromAddress = user.emailFromAddress || "Maliyet Analizi <onboarding@resend.dev>";
      
      const emailOptions: any = {
        from: fromAddress,
        to: [email],
        subject: subject,
        html: htmlContent,
      };

      if (ccList.length > 0) {
        emailOptions.cc = ccList;
      }

      const { data, error } = await resend.emails.send(emailOptions);

      if (error) {
        console.error("Email send error:", error);
        return res.status(500).json({ error: "E-posta gönderilemedi", details: error.message });
      }

      res.json({ 
        success: true, 
        messageId: data?.id,
        sentTo: email,
        ccList: ccList,
      });
    } catch (error) {
      console.error("Email send error:", error);
      res.status(500).json({ error: "E-posta gönderilemedi" });
    }
  });

  return httpServer;
}
