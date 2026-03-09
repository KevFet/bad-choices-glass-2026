'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Lobby from '@/components/Lobby';
import Game from '@/components/Game';

export default function Home() {
  const [roomCode, setRoomCode] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('currentRoom') : null);
  const [myId, setMyId] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('playerId') : null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(typeof window !== 'undefined' ? localStorage.getItem('isHost') === 'true' : false);
  const [status, setStatus] = useState<'LOBBY' | 'GAME'>(typeof window !== 'undefined' && localStorage.getItem('currentRoom') ? 'GAME' : 'LOBBY');

  useEffect(() => {
    if (!roomCode) return;

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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: myId,
            nickname: localStorage.getItem('nickname') || 'Anonyme',
            is_host: isHost,
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

    // 1. Create the room
    const { error: roomError } = await supabase.from('bad_choices_rooms').insert({
      code,
      status: 'LOBBY'
    });

    if (roomError) {
      alert("Erreur lors de la création de la salle");
      return;
    }

    // 2. Register the player
    await supabase.from('bad_choices_players').insert({
      id: playerId,
      room_code: code,
      nickname,
      is_host: true
    });

    localStorage.setItem('nickname', nickname);
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('currentRoom', code);
    localStorage.setItem('isHost', 'true');

    setMyId(playerId);
    setRoomCode(code);
    setIsHost(true);
    setStatus('GAME');
  };

  const handleJoin = async (nickname: string, code: string) => {
    // 1. Check if room exists
    const { data: room } = await supabase.from('bad_choices_rooms').select('*').eq('code', code).single();
    if (!room) {
      alert("Salle introuvable !");
      return;
    }

    const playerId = crypto.randomUUID();

    // 2. Register the player
    await supabase.from('bad_choices_players').insert({
      id: playerId,
      room_code: code,
      nickname,
      is_host: false
    });

    localStorage.setItem('nickname', nickname);
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('currentRoom', code);
    localStorage.setItem('isHost', 'false');

    setMyId(playerId);
    setRoomCode(code);
    setIsHost(false);
    setStatus('GAME');
  };

  const handleLeave = () => {
    localStorage.removeItem('currentRoom');
    localStorage.removeItem('isHost');
    setRoomCode(null);
    setStatus('LOBBY');
  };

  return (
    <main className="relative z-10 w-full min-h-screen">
      {status === 'LOBBY' ? (
        <Lobby onCreate={handleCreate} onJoin={handleJoin} />
      ) : (
        <Game
          roomCode={roomCode!}
          myId={myId!}
          players={players}
          isHost={isHost}
          onLeave={handleLeave}
        />
      )}
    </main>
  );
}
