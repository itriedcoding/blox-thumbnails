import { RobloxAvatar, AvatarModel } from "../types";

// We use a CORS proxy because Roblox APIs do not allow direct browser calls from unauthorized domains.
// This ensures "No Fake" functionality by hitting the real API.
const CORS_PROXY = "https://corsproxy.io/?";

export const getRobloxAvatar = async (username: string, model: AvatarModel): Promise<RobloxAvatar> => {
  try {
    // 1. Get User ID from Username
    // API: https://users.roblox.com/v1/usernames/users
    const userBody = {
      usernames: [username],
      excludeBannedUsers: true
    };
    
    const userResponse = await fetch(`${CORS_PROXY}https://users.roblox.com/v1/usernames/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userBody)
    });

    if (!userResponse.ok) throw new Error("Failed to fetch user ID");
    
    const userData = await userResponse.json();
    if (!userData.data || userData.data.length === 0) {
      throw new Error("User not found");
    }

    const userId = userData.data[0].id;

    // 2. Get Avatar Image URL
    // API: https://thumbnails.roblox.com/v1/users/avatar-headshot or avatar
    // We use 'avatar' for full body reference which is better for thumbnails
    const thumbUrl = `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`;
    
    const thumbResponse = await fetch(`${CORS_PROXY}${thumbUrl}`);
    if (!thumbResponse.ok) throw new Error("Failed to fetch avatar metadata");
    
    const thumbData = await thumbResponse.json();
    
    if (!thumbData.data || thumbData.data.length === 0 || thumbData.data[0].state !== 'Completed') {
      throw new Error("Avatar image not available");
    }

    const imageUrl = thumbData.data[0].imageUrl;

    // 3. Fetch the actual image data to convert to Base64 (needed for Gemini)
    const imageResponse = await fetch(`${CORS_PROXY}${imageUrl}`);
    const imageBlob = await imageResponse.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          username,
          userId,
          imageUrl, // URL for display
          base64: reader.result as string, // Base64 for AI
          model
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

  } catch (error) {
    console.error("Roblox API Error:", error);
    throw error;
  }
};