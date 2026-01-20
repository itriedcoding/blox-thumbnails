import { RobloxAvatar, AvatarModel, RobloxGame } from "../types";

// PROXY ROTATION STRATEGY
// We rotate between multiple high-availability CORS proxies to ensure uptime.
const PROXIES = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const fetchWithRetries = async (targetUrl: string): Promise<any> => {
    let lastError;
    for (const proxyGen of PROXIES) {
        try {
            const proxyUrl = proxyGen(targetUrl);
            const res = await fetch(proxyUrl);
            if (!res.ok) {
                // If 429 Too Many Requests, definitely switch proxy
                if (res.status === 429) throw new Error("Rate Limited");
                throw new Error(`Status ${res.status}`);
            }
            const data = await res.json();
            return data;
        } catch (error: any) {
            console.warn(`Proxy attempt failed for ${targetUrl}:`, error.message);
            lastError = error;
            // Continue to next proxy
        }
    }
    throw lastError || new Error("All proxies failed");
};

export const getRobloxAvatar = async (username: string, model: AvatarModel): Promise<RobloxAvatar> => {
  try {
    // 1. Get User ID - Switch to GET search to avoid POST proxy issues
    const targetUserUrl = `https://users.roblox.com/v1/users/search?keyword=${username}&limit=10`;
    const searchData = await fetchWithRetries(targetUserUrl);

    if (!searchData.data || searchData.data.length === 0) {
        throw new Error("User not found");
    }
    
    // Find exact match or first result
    const user = searchData.data.find((u: any) => u.name.toLowerCase() === username.toLowerCase()) || searchData.data[0];
    const userId = user.id;
    const realUsername = user.name;

    // 2. Get Avatar Metadata
    const thumbUrl = `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`;
    const thumbData = await fetchWithRetries(thumbUrl);
    
    if (!thumbData.data || thumbData.data.length === 0 || thumbData.data[0].state !== 'Completed') {
      throw new Error("Avatar thumbnail not ready");
    }

    const imageUrl = thumbData.data[0].imageUrl;

    // 3. Get Base64
    let imageBlob: Blob | null = null;
    for (const proxyGen of PROXIES) {
        try {
            const res = await fetch(proxyGen(imageUrl));
            if (res.ok) {
                imageBlob = await res.blob();
                break;
            }
        } catch (e) { continue; }
    }
    
    if (!imageBlob) throw new Error("Failed to download avatar image");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          username: realUsername,
          userId,
          imageUrl,
          base64: reader.result as string,
          model
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

  } catch (error: any) {
    console.error("Roblox Avatar Error:", error);
    throw new Error(error.message || "Failed to load avatar");
  }
};

export const getTopGames = async (limit: number = 100): Promise<RobloxGame[]> => {
    try {
        let gamesRaw: any[] = [];
        let universeIds: number[] = [];

        // STRATEGY 1: Official Sorts (Mimic "Popular" tab)
        // This gives us the true "Top" list.
        try {
            const sortsData = await fetchWithRetries("https://games.roblox.com/v1/games/sorts?gameSortsContext=GamesDefaultSorts");
            const popularSort = sortsData.sorts?.find((s: any) => 
                s.name === "Popular" || s.name === "MostEngaging" || s.displayName === "Popular"
            ) || sortsData.sorts?.[0];

            if (popularSort?.token) {
                const listData = await fetchWithRetries(`https://games.roblox.com/v1/games/list?sortToken=${popularSort.token}&limit=${limit}`);
                if (listData.games?.length > 0) {
                    gamesRaw = listData.games;
                }
            }
        } catch (e) {
            console.warn("Strategy 1 (Sorts) failed, attempting live aggregation...", e);
        }

        // STRATEGY 2: Live Aggregation (Mimic "Home" Page Discovery)
        // If sorts fail, we build a diverse list by querying major categories live.
        // This ensures NO mocks/fakes, only real games from the API.
        if (gamesRaw.length === 0) {
            console.log("Using Strategy 2: Live Category Aggregation");
            const categories = ["Simulator", "Roleplay", "Tycoon", "Obby", "Anime", "Action", "Survival", "Horror"];
            
            // Fetch categories in parallel to be fast
            const promises = categories.map(cat => 
                fetchWithRetries(`https://games.roblox.com/v1/games/list?keyword=${cat}&limit=20`)
                    .then(data => data.games || [])
                    .catch(() => [])
            );
            
            const results = await Promise.all(promises);
            // Interleave results to create a mixed feed
            const maxLength = Math.max(...results.map(r => r.length));
            for (let i = 0; i < maxLength; i++) {
                for (const catGames of results) {
                    if (catGames[i]) gamesRaw.push(catGames[i]);
                }
            }
        }

        // Deduplicate
        const uniqueMap = new Map();
        gamesRaw.forEach((g: any) => {
            const uId = g.universeId || g.id;
            if (uId && !uniqueMap.has(uId)) {
                uniqueMap.set(uId, g);
            }
        });
        
        gamesRaw = Array.from(uniqueMap.values());

        if (gamesRaw.length === 0) throw new Error("Unable to retrieve any games from Roblox API");

        // Limit processing
        const slicedGames = gamesRaw.slice(0, limit);
        universeIds = slicedGames.map((g: any) => g.universeId || g.id);
        const idsString = universeIds.join(',');

        // 3. Batch Details (Live Stats)
        const detailsData = await fetchWithRetries(`https://games.roblox.com/v1/games?universeIds=${idsString}`);
        const detailsMap = new Map<any, any>((detailsData.data || []).map((d: any) => [d.id, d]));

        // 4. Batch Thumbnails (Live Images)
        const thumbData = await fetchWithRetries(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${idsString}&size=512x512&format=Png&isCircular=false`);
        const thumbMap = new Map<any, string>((thumbData.data || []).map((t: any) => [t.targetId, t.imageUrl]));

        // 5. Merge
        return slicedGames.map((raw: any) => {
            const id = raw.universeId || raw.id;
            const detail = detailsMap.get(id);
            
            // Prefer detail data, fallback to raw list data
            return {
                id: id,
                rootPlaceId: detail?.rootPlaceId || raw?.placeId || 0,
                name: detail?.name || raw?.name || "Unknown",
                description: detail?.description || raw?.gameDescription || "",
                playerCount: detail?.playing || raw?.playerCount || 0,
                visits: detail?.visits || 0,
                creatorName: detail?.creator?.name || raw?.creatorName || "Unknown",
                thumbnailUrl: thumbMap.get(id),
                upVotes: 0,
                downVotes: 0
            };
        }).sort((a: RobloxGame, b: RobloxGame) => b.playerCount - a.playerCount);

    } catch (error: any) {
        console.error("Game Fetch Error:", error);
        throw new Error("Could not load Top Games. Roblox API may be unreachable.");
    }
}