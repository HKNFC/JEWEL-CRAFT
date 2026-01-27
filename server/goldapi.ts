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
    const usdError = await goldUsdResponse.text();
    const tryError = await goldTryResponse.text();
    console.error("GoldAPI USD response:", usdError);
    console.error("GoldAPI TRY response:", tryError);
    throw new Error(`Failed to fetch gold prices from GoldAPI: USD=${goldUsdResponse.status}, TRY=${goldTryResponse.status}`);
  }

  const goldUsd = await goldUsdResponse.json();
  const goldTry = await goldTryResponse.json();
  
  console.log("GoldAPI USD data:", JSON.stringify(goldUsd));
  console.log("GoldAPI TRY data:", JSON.stringify(goldTry));

  // Check for API error responses
  if (goldUsd.error || goldTry.error) {
    throw new Error(`GoldAPI error: ${goldUsd.error || goldTry.error}`);
  }

  const usdPrice = goldUsd.price || goldUsd.price_gram_24k;
  const tryPrice = goldTry.price || goldTry.price_gram_24k;
  
  if (!usdPrice || !tryPrice) {
    throw new Error("Invalid price data received from GoldAPI");
  }

  const usdTry = tryPrice / usdPrice;
  // Gold price per gram in USD (more reliable for calculations)
  const gold24kPerGramUsd = usdPrice / TROY_OUNCE_TO_GRAMS;

  return {
    usdTry: parseFloat(usdTry.toFixed(4)),
    gold24kPerGram: parseFloat(gold24kPerGramUsd.toFixed(2)),
    gold24kCurrency: "USD",
  };
}
