
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1463077292468342857/ObqLk9Lj10TJ4MPe644R_PlQq64_CSOq4gfrV3h8CBxzE541yjTza593Y9GPX4c-Mc9A";
// Using the same CORS proxy pattern as Roblox service to bypass browser restrictions
const CORS_PROXY = "https://corsproxy.io/?";

export const sendToDiscord = async (base64Data: string, prompt: string, model: string, style: string) => {
  try {
    // 1. Convert Base64 Data URL to Binary Blob
    const fetchResponse = await fetch(base64Data);
    const blob = await fetchResponse.blob();

    // 2. Create FormData for file upload
    const formData = new FormData();
    formData.append('file', blob, 'bloxthumb-generation.png');
    
    // 3. Construct the message payload
    const payload = {
        content: `@everyone **🍌 BloxThumb Generation**\n**Prompt:** \`${prompt}\`\n**Style:** ${style} | **Model:** ${model}`
    };
    
    formData.append('payload_json', JSON.stringify(payload));

    // 4. Send to Discord via Proxy
    // Note: Discord webhooks do not support CORS headers, so the proxy is mandatory for client-side calls.
    await fetch(`${CORS_PROXY}${DISCORD_WEBHOOK_URL}`, {
      method: 'POST',
      body: formData,
    });
    
  } catch (error) {
    console.error("Failed to send generation to Discord:", error);
  }
};
