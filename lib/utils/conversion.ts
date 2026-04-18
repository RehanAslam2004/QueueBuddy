import { supabase } from "@/lib/supabase";

export async function checkAndConvertExpiredItems() {
  const now = new Date().toISOString();

  // 1. Check for expired sessions (scheduled raids)
  const { data: expiredSessions, error: sessionError } = await supabase
    .from('sessions')
    .select('*, session_players(*)')
    .lt('time', now);

  if (expiredSessions && expiredSessions.length > 0) {
    for (const session of expiredSessions) {
      try {
        // Create server from session
        // origin_id prevents duplicate servers if multiple clients trigger this
        const { data: server, error: serverError } = await supabase
          .from('servers')
          .insert({
            origin_id: session.id,
            host_id: session.creator_id,
            game: session.game,
            max_players: session.max_players,
            connect_info: "Session Active - Check Discord/Steam",
            tags: ['Auto-Converted', 'Raid'],
            status: 'active'
          })
          .select()
          .single();

        if (server && session.session_players && session.session_players.length > 0) {
          // Move players to server_players
          const playersToMove = session.session_players.map((p: any) => ({
            server_id: server.id,
            temp_user_id: p.temp_user_id,
            username: p.username
          }));

          // Use upsert to prevent unique constraint errors if some players are already there
          await supabase.from('server_players').upsert(playersToMove, {
              onConflict: 'server_id, temp_user_id'
          });
        }
        
        // After successful conversion, delete the session to stop further checks
        if (!serverError || serverError.code === '23505') { // 23505 is unique violation (already converted)
            await supabase.from('sessions').delete().eq('id', session.id);
        }
      } catch (err) {
        console.error('Conversion failed for session:', session.id, err);
      }
    }
  }

  // 2. Check for featured events (revive world)
  const { data: featuredEvents } = await supabase
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .lt('event_time', now);
    
  if (featuredEvents && featuredEvents.length > 0) {
      for (const event of featuredEvents) {
          try {
              // Create Master Lobby for the event
              const { data: server, error: serverError } = await supabase
                .from('servers')
                .insert({
                  origin_id: event.id,
                  host_id: '00000000-0000-0000-0000-000000000000', // System Host
                  game: event.game,
                  max_players: event.total_slots,
                  connect_info: "EVENT STARTED - JOIN MASTER SERVER",
                  tags: ['OFFICIAL', 'EVENT'],
                  status: 'active'
                })
                .select()
                .single();
              
              if (!serverError || serverError.code === '23505') {
                  // Mark event as unfeatured so it doesn't try again
                  await supabase.from('events').update({ is_featured: false }).eq('id', event.id);
              }
          } catch (err) {
              console.error('Event conversion failed:', event.id, err);
          }
      }
  }
}
