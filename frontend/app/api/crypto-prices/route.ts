import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: Request) {
    try {
        // Check if we have valid cached data
        const now = Date.now();
        if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
            console.log('Returning cached crypto data');
            return NextResponse.json(cachedData);
        }

        console.log('Fetching fresh crypto data from CoinGecko...');

        // Fetch 400 coins by making 2 sequential requests with delay
        const response1 = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 200,
                page: 1,
                sparkline: true,
                price_change_percentage: "1h,24h,7d",
            },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OnchainSIP/1.0'
            }
        });

        // Wait 1 second to avoid rate limiting
        await delay(1000);

        const response2 = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 200,
                page: 2,
                sparkline: true,
                price_change_percentage: "1h,24h,7d",
            },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OnchainSIP/1.0'
            }
        });

        // Combine results
        const allCoins = [...response1.data, ...response2.data];

        // Update cache
        cachedData = allCoins;
        cacheTimestamp = now;

        console.log(`Successfully fetched ${allCoins.length} coins`);
        return NextResponse.json(allCoins);

    } catch (error: any) {
        console.error('Error fetching crypto data:', error?.message);

        // If we have cached data, return it even if expired
        if (cachedData) {
            console.log('Returning stale cached data due to error');
            return NextResponse.json(cachedData);
        }

        // Handle rate limiting specifically
        if (error.response?.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again in a few minutes.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch crypto data' },
            { status: error.response?.status || 500 }
        );
    }
}
