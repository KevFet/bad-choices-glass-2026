'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface LobbyProps {
    onJoin: (roomCode: string, nickname: string) => void;
    onCreate: (nickname: string) => void;
}

export default function Lobby({ onJoin, onCreate }: LobbyProps) {
    const [nickname, setNickname] = useState('');
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <motion.h1
                className="title-massive text-center mb-12"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                Bad<br />Choices
            </motion.h1>

            <motion.div
                className="glass p-8 rounded-3xl w-full max-w-md space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <input
                    type="text"
                    placeholder="TON PSEUDO"
                    className="input-glass text-center uppercase font-bold"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                />

                {isJoining ? (
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="CODE DE LA SALLE"
                            className="input-glass text-center uppercase font-bold tracking-widest"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                        />
                        <button
                            className="w-full bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                            onClick={() => onJoin(code, nickname)}
                        >
                            REJOINDRE
                        </button>
                        <button
                            className="w-full bg-transparent border border-white/20 text-white"
                            onClick={() => setIsJoining(false)}
                        >
                            RETOUR
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            className="w-full bg-white text-black hover:scale-105 transition-transform"
                            onClick={() => onCreate(nickname)}
                        >
                            CRÉER UNE SALLE
                        </button>
                        <button
                            className="w-full bg-transparent border border-white/20 text-white"
                            onClick={() => setIsJoining(true)}
                        >
                            R-EJOINDRE AVEC UN CODE
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
