'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogIn, ChevronRight, Share2, Users } from 'lucide-react';

interface LobbyProps {
    onJoin: (nickname: string, code: string) => void;
    onCreate: (nickname: string) => void;
}

export default function Lobby({ onJoin, onCreate }: LobbyProps) {
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [view, setView] = useState<'root' | 'join' | 'create'>('root');

    const containerVariants = {
        hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        exit: { opacity: 0, y: -20, filter: "blur(20px)" }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            <AnimatePresence mode="wait">

                {view === 'root' && (
                    <motion.div
                        key="root"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-lg space-y-12"
                    >
                        <div className="space-y-4">
                            <motion.div
                                className="w-12 h-0.5 bg-indigo/50 mb-8"
                                initial={{ width: 0 }}
                                animate={{ width: 48 }}
                                transition={{ delay: 0.2, duration: 1 }}
                            />
                            <h1 className="title-gigantic">
                                BAD<br />
                                CHOICES
                            </h1>
                            <div className="flex gap-4 items-center opacity-40">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Next-Gen 2026</span>
                                <div className="h-px flex-1 bg-white/20" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="TON PSEUDO"
                                className="input-elite text-lg font-black tracking-widest placeholder:text-white/20"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value.toUpperCase())}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => nickname && setView('create')}
                                    className={`btn-elite group ${nickname ? 'border-indigo/40 h-20' : 'opacity-20 cursor-not-allowed h-16'}`}
                                >
                                    <Plus size={16} className="absolute left-6 group-hover:rotate-90 transition-transform duration-500" />
                                    <span>CRÉER</span>
                                </button>
                                <button
                                    onClick={() => nickname && setView('join')}
                                    className={`btn-elite group ${nickname ? 'border-magenta-500/40 h-20' : 'opacity-20 cursor-not-allowed h-16'}`}
                                >
                                    <LogIn size={16} className="absolute left-6 group-hover:-translate-x-1 transition-transform" />
                                    <span>REJOINDRE</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'create' && (
                    <motion.div
                        key="create"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-md glass-elite p-12 text-center space-y-8"
                    >
                        <h2 className="text-3xl font-black uppercase tracking-tighter">PRÊT ?</h2>
                        <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                            TU ES SUR LE POINT DE LANÇER UNE SESSION D'ANALYSE SOCIALE POUR <span className="text-indigo-400 font-bold">{nickname}</span>.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => onCreate(nickname)}
                                className="btn-elite btn-solid h-16 w-full text-black"
                            >
                                INITIALISER LA SALLE
                            </button>
                            <button
                                onClick={() => setView('root')}
                                className="btn-elite w-full border-none opacity-40 hover:opacity-100"
                            >
                                RETOUR
                            </button>
                        </div>
                    </motion.div>
                )}

                {view === 'join' && (
                    <motion.div
                        key="join"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-md glass-elite p-12 space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">CODE D'ACCÈS</h2>
                            <p className="text-white/20 text-[10px] tracking-widest font-black">ENTRE LE CODE DU MAÎTRE DU JEU</p>
                        </div>

                        <input
                            type="text"
                            maxLength={4}
                            placeholder="0000"
                            className="input-elite text-center text-5xl font-black tracking-[0.5em] placeholder:text-white/5 py-8"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />

                        <div className="space-y-3">
                            <button
                                onClick={() => onJoin(nickname, roomCode)}
                                className={`btn-elite h-16 w-full ${roomCode.length === 4 ? 'btn-solid' : 'opacity-20 cursor-not-allowed'}`}
                                disabled={roomCode.length !== 4}
                            >
                                ACCÉDER À LA SESSION
                            </button>
                            <button
                                onClick={() => setView('root')}
                                className="btn-elite w-full border-none opacity-40 hover:opacity-100"
                            >
                                RETOUR
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
