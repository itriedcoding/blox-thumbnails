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

export const getGameDetailsFromUrl = async (url: string): Promise<RobloxGame> => {
    // Extract ID from URL like https://www.roblox.com/games/123456/Game-Name
    const match = url.match(/\/games\/(\d+)\//);
    if (!match) throw new Error("Invalid Roblox Game URL");
    const placeId = match[1];

    // Get Universe ID
    const universeUrl = `https://apis.roblox.com/universes/v1/places/${placeId}/universe`;
    const universeData = await fetchWithRetries(universeUrl);
    const universeId = universeData.universeId;

    // Get Game Details
    const detailsUrl = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
    const detailsData = await fetchWithRetries(detailsUrl);
    const game = detailsData.data[0];

    // Get Thumbnail
    const thumbUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`;
    const thumbData = await fetchWithRetries(thumbUrl);
    const thumb = thumbData.data[0]?.imageUrl;

    return {
        id: universeId,
        rootPlaceId: parseInt(placeId),
        name: game.name,
        description: game.description,
        playerCount: game.playing,
        visits: game.visits,
        creatorName: game.creator.name,
        thumbnailUrl: thumb,
        upVotes: 0,
        downVotes: 0
    };
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

export const getTopGames = async (limit: number = 40): Promise<RobloxGame[]> => {
    try {
        // 1. Fetch Games List
        const listUrl = `https://games.roblox.com/v1/games/list?sortToken=&limit=${limit}`;
        const listData = await fetchWithRetries(listUrl);
        
        if (!listData.games) return [];
        
        const gamesBasic = listData.games;
        const universeIds = gamesBasic.map((g: any) => g.universeId).join(',');

        // 2. Get Details (for visits, proper description)
        const detailsUrl = `https://games.roblox.com/v1/games?universeIds=${universeIds}`;
        const detailsData = await fetchWithRetries(detailsUrl);
        const detailsMap = new Map();
        if (detailsData.data) {
            detailsData.data.forEach((d: any) => detailsMap.set(d.id, d));
        }

        // 3. Get Thumbnails
        const thumbUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`;
        const thumbMap = new Map();
        try {
            const thumbData = await fetchWithRetries(thumbUrl);
            if (thumbData.data) {
                thumbData.data.forEach((d: any) => thumbMap.set(d.targetId, d.imageUrl));
            }
        } catch(e) { console.warn("Thumb fetch failed", e); }

        // 4. Merge Data
        return gamesBasic.map((g: any) => {
            const details = detailsMap.get(g.universeId);
            return {
                id: g.universeId,
                rootPlaceId: g.placeId,
                name: details?.name || g.name,
                description: details?.description || g.gameDescription || "",
                playerCount: details?.playing || g.playerCount || 0,
                visits: details?.visits || 0,
                creatorName: details?.creator?.name || g.creatorName || "Unknown",
                thumbnailUrl: thumbMap.get(g.universeId),
                upVotes: g.totalUpVotes || 0,
                downVotes: g.totalDownVotes || 0
            };
        });

    } catch (error: any) {
        console.error("Top Games Error:", error);
        throw new Error(error.message || "Failed to load games");
    }
};
