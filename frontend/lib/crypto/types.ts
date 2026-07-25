export interface CryptoData {
  id: string; symbol: string; name: string; image: string; current_price: number;
  price_change_percentage_1h_in_currency: number | null; price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null; market_cap: number; total_volume: number;
  sparkline_in_7d: { price: number[] } | null;
}

export interface CoinDetails {
  id: string; symbol: string; name: string; description: { en: string };
  links: { homepage: string[]; blockchain_site: string[] };
  image: { thumb: string; small: string; large: string }; market_cap_rank: number;
  community_data: { twitter_followers: number | null; reddit_subscribers: number | null };
  market_data: {
    current_price: { usd: number }; price_change_percentage_1h_in_currency: { usd: number };
    price_change_percentage_24h: number; price_change_percentage_7d: number; price_change_percentage_30d: number; price_change_percentage_1y: number;
    market_cap: { usd: number }; market_cap_change_percentage_24h: number; total_volume: { usd: number };
    circulating_supply: number; total_supply: number | null; max_supply: number | null;
    ath: { usd: number }; ath_change_percentage: { usd: number }; ath_date: { usd: string };
    atl: { usd: number }; atl_change_percentage: { usd: number }; atl_date: { usd: string };
    market_cap_fdv_ratio: number | null; fully_diluted_valuation: { usd: number | null };
    total_value_locked: { usd: number | null } | null; price_change_24h: number;
    high_24h: { usd: number }; low_24h: { usd: number };
  };
}
