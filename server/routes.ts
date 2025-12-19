import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertManufacturerSchema,
  insertStoneSettingRateSchema,
  insertGemstonePriceListSchema,
  insertAnalysisRecordSchema,
  insertExchangeRateSchema,
} from "@shared/schema";
import { fetchGoldPrices } from "./goldapi";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/manufacturers", async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manufacturers" });
    }
  });

  app.get("/api/manufacturers/:id", async (req, res) => {
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

  app.post("/api/manufacturers", async (req, res) => {
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

  app.patch("/api/manufacturers/:id", async (req, res) => {
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

  app.delete("/api/manufacturers/:id", async (req, res) => {
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

  app.get("/api/stone-setting-rates", async (req, res) => {
    try {
      const rates = await storage.getStoneSettingRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stone setting rates" });
    }
  });

  app.get("/api/stone-setting-rates/:id", async (req, res) => {
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

  app.post("/api/stone-setting-rates", async (req, res) => {
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

  app.patch("/api/stone-setting-rates/:id", async (req, res) => {
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

  app.delete("/api/stone-setting-rates/:id", async (req, res) => {
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

  app.get("/api/gemstone-prices", async (req, res) => {
    try {
      const prices = await storage.getGemstonePriceLists();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gemstone prices" });
    }
  });

  app.get("/api/gemstone-prices/:id", async (req, res) => {
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

  app.post("/api/gemstone-prices", async (req, res) => {
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

  app.patch("/api/gemstone-prices/:id", async (req, res) => {
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

  app.delete("/api/gemstone-prices/:id", async (req, res) => {
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

  app.get("/api/analysis-records", async (req, res) => {
    try {
      const records = await storage.getAnalysisRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis records" });
    }
  });

  app.get("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getAnalysisRecord(id);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch record" });
    }
  });

  app.post("/api/analysis-records", async (req, res) => {
    try {
      const { stones, ...recordData } = req.body;
      const parsed = insertAnalysisRecordSchema.safeParse({
        ...recordData,
        manufacturerId: recordData.manufacturerId ? parseInt(recordData.manufacturerId) : null,
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

  app.patch("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stones, ...recordData } = req.body;
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
      const record = await storage.updateAnalysisRecord(id, {
        ...recordData,
        manufacturerId: recordData.manufacturerId ? parseInt(recordData.manufacturerId) : null,
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

  app.delete("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnalysisRecord(id);
      if (!deleted) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  app.get("/api/exchange-rates/latest", async (req, res) => {
    try {
      const rate = await storage.getLatestExchangeRate();
      res.json(rate || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exchange rate" });
    }
  });

  app.post("/api/exchange-rates", async (req, res) => {
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

  app.post("/api/exchange-rates/fetch", async (req, res) => {
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

  app.get("/api/rapaport-prices", async (req, res) => {
    try {
      const prices = await storage.getRapaportPrices();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Rapaport prices" });
    }
  });

  app.post("/api/rapaport-prices", async (req, res) => {
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

  app.post("/api/rapaport-prices/upload", async (req, res) => {
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

  app.delete("/api/rapaport-prices", async (req, res) => {
    try {
      await storage.clearRapaportPrices();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear Rapaport prices" });
    }
  });

  app.get("/api/rapaport-prices/lookup", async (req, res) => {
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

  return httpServer;
}
