'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Lobby from '@/components/Lobby';
import Game from '@/components/Game';

export default function Home() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState<'LOBBY' | 'GAME'>('LOBBY');

  useEffect(() => {
    if (!roomCode) return;

    // Presence & Real-time channel
    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        presence: {
          key: myId!,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activePlayers = Object.values(newState).map((v: any) => v[0]);
        setPlayers(activePlayers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: myId,
            nickname: localStorage.getItem('nickname') || 'Anonyme',
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, myId]);

  const handleCreate = async (nickname: string) => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const playerId = crypto.randomUUID();

    // Save to DB
    await supabase.from('bad_choices_rooms').insert({ code, status: 'LOBBY' });
    await supabase.from('bad_choices_players').insert({ id: playerId, room_code: code, nickname, is_host: true });

    localStorage.setItem('nickname', nickname);
    setMyId(playerId);
    setRoomCode(code);
    setIsHost(true);
    setStatus('GAME');
  };

  const handleJoin = async (code: string, nickname: string) => {
    // Check if room exists
    const { data: room } = await supabase.from('bad_choices_rooms').select('*').eq('code', code).single();
    if (!room) {
      alert("Salla introuvable !");
      return;
    }

    const playerId = crypto.randomUUID();
    await supabase.from('bad_choices_players').insert({ id: playerId, room_code: code, nickname, is_host: false });

    localStorage.setItem('nickname', nickname);
    setMyId(playerId);
    setRoomCode(code);
    setIsHost(false);
    setStatus('GAME');
  };

  return (
    <main>
      {status === 'LOBBY' ? (
        <Lobby onCreate={handleCreate} onJoin={handleJoin} />
      ) : (
        <Game
          roomCode={roomCode!}
          myId={myId!}
          players={players}
          isHost={isHost}
          onLeave={() => setStatus('LOBBY')}
        />
      )}
    </main>
  );
}
