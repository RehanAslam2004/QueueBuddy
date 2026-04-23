export type MinecraftStatus = {
  online: boolean;
  ip: string;
  port: number;
  players?: {
    online: number;
    max: number;
  };
  version?: string;
  motd?: {
    clean: string[];
  };
};

/**
 * Fetches the status of a Minecraft server using the public mcsrvstat.us API.
 * 
 * @param address The IP address or domain of the Minecraft server (e.g., play.hypixel.net)
 * @returns The server status, or null if the API request fails.
 */
export async function getMinecraftStatus(address: string): Promise<MinecraftStatus | null> {
  try {
    // Strip out port if provided for the base URL, though the API handles it
    const cleanAddress = address.trim().replace(/^(https?:\/\/)/, '');
    
    // Using the v3 API which corresponds to standard Java Minecraft servers
    const response = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(cleanAddress)}`, {
      // Don't cache aggressively so we get real-time-ish data when first loading
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`Minecraft status API returned ${response.status} for ${address}`);
      return null;
    }

    const data = await response.json();
    return data as MinecraftStatus;
  } catch (error) {
    console.error(`Failed to fetch Minecraft status for ${address}:`, error);
    return null;
  }
}
