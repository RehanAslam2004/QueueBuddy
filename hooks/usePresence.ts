"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useIdentity } from './useIdentity';

/**
 * BUG FIX: Previous version destructured `identity` as a single object
 * from useIdentity, but useIdentity exposes `tempUserId` and `username`
 * as flat properties — there is no `identity` object. This caused a
 * crash on every page that imported usePresence.
 */
export function usePresence(serverId?: string, sessionId?: string) {
    const { tempUserId } = useIdentity();

    useEffect(() => {
        if (!tempUserId || (!serverId && !sessionId)) return;

        const cleanup = async () => {
            if (serverId) {
                // Remove player from server
                await supabase.from('server_players').delete().match({
                    server_id: serverId,
                    temp_user_id: tempUserId
                });

                // Reassign host if the leaving player was the host
                const { data: server } = await supabase
                    .from('servers')
                    .select('host_id')
                    .eq('id', serverId)
                    .single();

                if (server && server.host_id === tempUserId) {
                    const { data: remaining } = await supabase
                        .from('server_players')
                        .select('temp_user_id')
                        .eq('server_id', serverId)
                        .limit(1);

                    if (remaining && remaining.length > 0) {
                        await supabase.from('servers')
                            .update({ host_id: remaining[0].temp_user_id })
                            .eq('id', serverId);
                    } else {
                        // No players left — delete the server
                        await supabase.from('servers').delete().eq('id', serverId);
                    }
                }
            }

            if (sessionId) {
                await supabase.from('session_players').delete().match({
                    session_id: sessionId,
                    temp_user_id: tempUserId
                });
            }
        };

        return () => {
            cleanup();
        };
    }, [tempUserId, serverId, sessionId]);
}
