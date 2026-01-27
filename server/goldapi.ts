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

  // Fetch gold price in USD
  const goldUsdResponse = await fetch(`${GOLDAPI_BASE_URL}/XAU/USD`, { headers });

  if (!goldUsdResponse.ok) {
    const errorText = await goldUsdResponse.text();
    console.error("GoldAPI USD response error:", errorText);
    throw new Error(`Failed to fetch gold prices from GoldAPI: ${goldUsdResponse.status}`);
  }

  const goldUsd = await goldUsdResponse.json();
  console.log("GoldAPI USD data:", JSON.stringify(goldUsd));

  // Check for API error responses
  if (goldUsd.error) {
    throw new Error(`GoldAPI error: ${goldUsd.error}`);
  }

  // Use price_gram_24k directly if available, otherwise calculate from ounce price
  const gold24kPerGramUsd = goldUsd.price_gram_24k || (goldUsd.price / TROY_OUNCE_TO_GRAMS);
  
  if (!gold24kPerGramUsd) {
    throw new Error("Invalid price data received from GoldAPI");
  }

  // Note: USD/TRY rate needs to be entered manually or fetched from another source
  // For now, we'll return 0 for usdTry and let the user update it manually
  return {
    usdTry: 0, // User needs to update this manually
    gold24kPerGram: parseFloat(gold24kPerGramUsd.toFixed(2)),
    gold24kCurrency: "USD",
  };
}
