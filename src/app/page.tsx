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
    await supabase.from('bad_choices_rooms').insert({ code, status: 'LOBBY' });
    localStorage.setItem('nickname', nickname);
    setMyId(playerId);
    setRoomCode(code);
    setIsHost(true);
    setStatus('GAME');
  };

  const handleJoin = async (nickname: string, code: string) => {
    const { data: room } = await supabase.from('bad_choices_rooms').select('*').eq('code', code).single();
    if (!room) {
      alert("Salle introuvable !");
      return;
    }
    const playerId = crypto.randomUUID();
    localStorage.setItem('nickname', nickname);
    setMyId(playerId);
    setRoomCode(code);
    setIsHost(false);
    setStatus('GAME');
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
          onLeave={() => setStatus('LOBBY')}
        />
      )}
    </main>
  );
}
