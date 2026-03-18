import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

// Simple in-memory cache for individual coin details
const detailsCache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Coin ID is required' }, { status: 400 });
    }

    try {
        // Check cache
        const now = Date.now();
        const cached = detailsCache[id];

        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            console.log(`Returning cached details for ${id}`);
            return NextResponse.json(cached.data);
        }

        console.log(`Fetching fresh details for ${id} from CoinGecko...`);

        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`, {
            params: {
                localization: false,
                tickers: false,
                market_data: true,
                community_data: true,
                developer_data: false,
                sparkline: false
            },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OnchainSIP/1.0'
            },
            timeout: 10000, // 10 second timeout
        });

        // Update cache
        detailsCache[id] = {
            data: response.data,
            timestamp: now
        };

        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error(`Error fetching details for ${id}:`, error?.message);

        // Serve stale cache if available
        if (detailsCache[id]) {
            console.log(`Returning stale cached details for ${id} due to error`);
            return NextResponse.json(detailsCache[id].data);
        }

        if (error.response?.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again in a few minutes.' },
                { status: 429 }
            );
        }

        if (error.response?.status === 404) {
            return NextResponse.json(
                { error: 'Coin not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch coin details' },
            { status: error.response?.status || 500 }
        );
    }
}
