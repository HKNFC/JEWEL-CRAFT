const GOLDAPI_BASE_URL = "https://www.goldapi.io/api";

interface GoldApiResponse {
  timestamp: number;
  metal: string;
  currency: string;
  price: number;
  ch: number;
  chp: number;
  ask: number;
  bid: number;
}

export interface ExchangeRateData {
  usdTry: number;
  gold24kPerGram: number;
  gold24kCurrency: string;
}

const TROY_OUNCE_TO_GRAMS = 31.1035;

export async function fetchGoldPrices(apiKey: string): Promise<ExchangeRateData> {
  const headers = {
    "x-access-token": apiKey,
    "Content-Type": "application/json",
  };

  const [goldUsdResponse, goldTryResponse] = await Promise.all([
    fetch(`${GOLDAPI_BASE_URL}/XAU/USD`, { headers }),
    fetch(`${GOLDAPI_BASE_URL}/XAU/TRY`, { headers }),
  ]);

  if (!goldUsdResponse.ok || !goldTryResponse.ok) {
    throw new Error("Failed to fetch gold prices from GoldAPI");
  }

  const goldUsd: GoldApiResponse = await goldUsdResponse.json();
  const goldTry: GoldApiResponse = await goldTryResponse.json();

  const usdTry = goldTry.price / goldUsd.price;
  const gold24kPerGramTry = goldTry.price / TROY_OUNCE_TO_GRAMS;

  return {
    usdTry: parseFloat(usdTry.toFixed(4)),
    gold24kPerGram: parseFloat(gold24kPerGramTry.toFixed(2)),
    gold24kCurrency: "TRY",
  };
}
