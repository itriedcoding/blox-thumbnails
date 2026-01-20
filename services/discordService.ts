
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1454652546349269117/qVidNMqFry5EJr64lPl5j2J0ZOLmJ7ZLhNFH4VcRVSB8GhZn1JOEuOX8sovKtgUGoSym";
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
        content: `**🍌 BloxThumb Generation**\n**Prompt:** \`${prompt}\`\n**Style:** ${style} | **Model:** ${model}`
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
