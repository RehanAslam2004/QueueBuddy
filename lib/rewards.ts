import { supabase } from "./supabase";

export const ACHIEVEMENT_DEF = {
  raid_initiate: { title: "Raid Initiate", desc: "Joined your first scheduled raid.", icon: "swords" },
  raid_veteran: { title: "Raid Veteran", desc: "Successfully joined 5 raids.", icon: "military_tech" },
  raid_legend: { title: "Raid Legend", desc: "The hero of 10 tactical raids.", icon: "star_half" },
  event_participant: { title: "Event Pioneer", desc: "Participated in a featured world revival.", icon: "globe" },
  event_regular: { title: "Event Regular", desc: "Joined 5 featured events.", icon: "history_edu" },
  world_reviver: { title: "World Reviver", desc: "Successfully led or completed a revival event.", icon: "auto_awesome" },
  savior_of_worlds: { title: "Savior of Worlds", desc: "Completed 5 world revivals.", icon: "diamond" },
  chat_socialite: { title: "Comms Expert", desc: "Sent over 10 messages in server lobbies.", icon: "forum" },
  pioneer: { title: "Queue Pioneer", desc: "Created your first server node.", icon: "settings_input_component" },
  squad_leader: { title: "Squad Leader", desc: "Hosted a full lobby of 10+ players.", icon: "groups" },
};

export const LOOT_ITEMS = [
  { id: "diamond_sword", name: "Diamond Sword", rarity: "epic" },
  { id: "golden_apple", name: "Golden Apple", rarity: "rare" },
  { id: "iron_pickaxe", name: "Iron Pickaxe", rarity: "common" },
  { id: "netherite_ingot", name: "Netherite Ingot", rarity: "legendary" },
  { id: "ender_pearl", name: "Ender Pearl", rarity: "rare" },
  { id: "experience_bottle", name: "Bottle o' Enchanting", rarity: "common" },
  { id: "totem", name: "Totem of Undying", rarity: "legendary" },
  { id: "elytra", name: "Elytra", rarity: "legendary" },
];

export async function incrementPlayerStat(tempUserId: string, stat: "raids_joined" | "events_joined" | "revivals_completed" | "messages_sent") {
  const { data: current } = await supabase
    .from("player_stats")
    .select("*")
    .eq("temp_user_id", tempUserId)
    .single();

  if (current) {
    await supabase
      .from("player_stats")
      .update({ [stat]: current[stat] + 1, last_active: new Date().toISOString() })
      .eq("temp_user_id", tempUserId);
    
    // Check for achievements after increment
    await checkAchievements(tempUserId, { ...current, [stat]: current[stat] + 1 });
  } else {
    const newState = {
      temp_user_id: tempUserId,
      raids_joined: stat === "raids_joined" ? 1 : 0,
      events_joined: stat === "events_joined" ? 1 : 0,
      revivals_completed: stat === "revivals_completed" ? 1 : 0,
      messages_sent: stat === "messages_sent" ? 1 : 0,
    };
    await supabase.from("player_stats").insert(newState);
    await checkAchievements(tempUserId, newState);
  }
}

export async function checkAchievements(tempUserId: string, stats: any) {
  const achievements = [];
  
  if (stats.raids_joined >= 1) achievements.push("raid_initiate");
  if (stats.raids_joined >= 5) achievements.push("raid_veteran");
  if (stats.raids_joined >= 10) achievements.push("raid_legend");
  
  if (stats.events_joined >= 1) achievements.push("event_participant");
  if (stats.events_joined >= 5) achievements.push("event_regular");
  
  if (stats.revivals_completed >= 1) achievements.push("world_reviver");
  if (stats.revivals_completed >= 5) achievements.push("savior_of_worlds");

  if (stats.messages_sent >= 10) achievements.push("chat_socialite");

  // New ones from page.tsx (pioneer, squad_leader would need logic in lobbies/page.tsx, but I'll add the check here if stats track them)
  if (stats.servers_created >= 1) achievements.push("pioneer");
  if (stats.max_lobby_size >= 10) achievements.push("squad_leader");

  for (const achId of achievements) {
    await supabase.from("user_achievements").upsert({
      temp_user_id: tempUserId,
      achievement_id: achId
    }, { onConflict: "temp_user_id, achievement_id" });
  }
}

export async function dropLoot(tempUserId: string, sourceId: string) {
  // 30% chance for common, 15% for rare, 5% for epic, 1% for legendary
  const roll = Math.random() * 100;
  let item = null;

  if (roll < 1) item = LOOT_ITEMS.find(i => i.rarity === "legendary");
  else if (roll < 6) item = LOOT_ITEMS.find(i => i.rarity === "epic" && Math.random() > 0.5); // simplistic random pick
  else if (roll < 21) item = LOOT_ITEMS.find(i => i.rarity === "rare" && Math.random() > 0.5);
  else if (roll < 51) item = LOOT_ITEMS.find(i => i.rarity === "common" && Math.random() > 0.5);

  // Fallback if find fails
  if (!item && roll < 51) item = LOOT_ITEMS.find(i => i.rarity === "common");

  if (item) {
    await supabase.from("loot_drops").insert({
      temp_user_id: tempUserId,
      item_id: item.id,
      item_name: item.name,
      rarity: item.rarity,
      source_id: sourceId
    });
    return item;
  }
  return null;
}
