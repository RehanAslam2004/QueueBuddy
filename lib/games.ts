export const GAMES = {
  "The OGs": [
    { name: "Halo 3", icon: "sports_kabaddi" },
    { name: "Halo Reach", icon: "military_tech" },
    { name: "Halo 2: Vista", icon: "shield" },
    { name: "Halo CE", icon: "stars" },
    { name: "Halo 4", icon: "rocket" },
    { name: "Left 4 Dead 2", icon: "skull" },
    { name: "Team Fortress 2", icon: "construction" },
    { name: "Garry's Mod", icon: "category" },
    { name: "Counter-Strike: Source", icon: "gps_fixed" },
    { name: "Half-Life 2: Deathmatch", icon: "science" },
    { name: "COD: MW2 (2009)", icon: "token" },
    { name: "COD: Black Ops", icon: "visibility" },
    { name: "COD: Black Ops II", icon: "memory" },
    { name: "Battlefield 3", icon: "explosion" },
    { name: "Battlefield: Bad Company 2", icon: "house" },
    { name: "Battlefield 4", icon: "local_fire_department" },
    { name: "Quake Champions", icon: "flash_on" },
    { name: "Unreal Tournament 2004", icon: "bolt" },
    { name: "StarCraft II", icon: "precision_manufacturing" },
    { name: "Warcraft III", icon: "castle" },
  ],
  "Modern Hits": [
    { name: "Minecraft", icon: "grid_view" },
    { name: "Roblox", icon: "videogame_asset" },
    { name: "Counter-Strike 2", icon: "target" },
    { name: "Valorant", icon: "detector_smoke" },
    { name: "League of Legends", icon: "swords" },
    { name: "Dota 2", icon: "pentagon" },
    { name: "Helldivers 2", icon: "rocket_launch" },
    { name: "Apex Legends", icon: "legend_toggle" },
    { name: "Fortnite", icon: "fort" },
    { name: "Overwatch 2", icon: "rebase_edit" },
    { name: "Rainbow Six Siege", icon: "door_front" },
    { name: "Rocket League", icon: "sports_motorsports" },
    { name: "The Finals", icon: "monetization_on" },
    { name: "Warframe", icon: "robot_2" },
    { name: "Destiny 2", icon: "flare" },
  ],
  "Tactical & Survival": [
    { name: "Rust", icon: "house" },
    { name: "DayZ", icon: "directions_run" },
    { name: "Project Zomboid", icon: "coronavirus" },
    { name: "Squad", icon: "groups" },
    { name: "Insurgency: Sandstorm", icon: "wind_power" },
    { name: "ARMA 3", icon: "map" },
    { name: "Escape from Tarkov", icon: "backpack" },
    { name: "7 Days to Die", icon: "bedtime" },
    { name: "Valheim", icon: "landscape" },
    { name: "Terraria", icon: "grass" },
    { name: "ARK: Survival Ascended", icon: "cruelty_free" },
    { name: "Palworld", icon: "pets" },
    { name: "Sea of Thieves", icon: "sailing" },
    { name: "Among Us", icon: "emergency_home" },
    { name: "Phasmophobia", icon: "vaping_rooms" },
  ],
  "MMO & Competitive": [
    { name: "World of Warcraft", icon: "castle" },
    { name: "Final Fantasy XIV", icon: "auto_awesome" },
    { name: "Guild Wars 2", icon: "shield_moon" },
    { name: "Old School RuneScape", icon: "book_2" },
    { name: "Dead by Daylight", icon: "skull" },
    { name: "Stardew Valley", icon: "potted_plant" },
    { name: "Fallout 76", icon: "radiation" },
  ]
};

export const getGameIcon = (gameName: string) => {
  for (const cat in GAMES) {
    const game = (GAMES as any)[cat].find((g: any) => g.name === gameName);
    if (game) return game.icon;
  }
  return 'videogame_asset';
};
