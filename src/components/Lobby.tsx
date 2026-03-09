'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogIn, ChevronRight, Share2, Users, ArrowRight } from 'lucide-react';

interface LobbyProps {
    onJoin: (nickname: string, code: string) => void;
    onCreate: (nickname: string) => void;
}

export default function Lobby({ onJoin, onCreate }: LobbyProps) {
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [view, setView] = useState<'root' | 'join' | 'create'>('root');

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
        },
        exit: { opacity: 0, scale: 1.02, y: -20, filter: "blur(20px)" }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 w-full overflow-hidden">

            {/* Magazine Title Section */}
            <motion.div
                className="mb-16 md:mb-24"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
            >
                <span className="block text-center text-[10px] uppercase font-black tracking-[0.6em] opacity-30 mb-2">Social Experiment / 2026 Edition</span>
                <h1 className="title-magazine tracking-tighter">
                    BAD<br />CHOICES
                </h1>
            </motion.div>

            <AnimatePresence mode="wait">

                {view === 'root' && (
                    <motion.div
                        key="root"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-2xl glass-bento p-10 md:p-16 flex flex-col items-center justify-center gap-10"
                    >
                        <div className="w-full flex flex-col items-center gap-6">
                            <div className="flex flex-col items-center gap-2 w-full mb-4">
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Identité du Sujet</span>
                                <input
                                    type="text"
                                    placeholder="TON PSEUDO"
                                    className="input-elite input-glow max-w-md text-center text-lg font-black tracking-widest placeholder:text-white/10 h-16 rounded-2xl"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="flex flex-col gap-4 w-full items-center">
                                <button
                                    onClick={() => nickname && setView('create')}
                                    className={`btn-frosted border-white/20 hover:scale-105 active:scale-95 transition-all w-full max-w-md h-20 group ${nickname ? 'border-white/20' : 'opacity-20 cursor-not-allowed'}`}
                                >
                                    <span className="relative z-10 font-black">CRÉER UNE SALLE</span>
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </button>
                                <div className="flex items-center gap-4 w-full max-w-md opacity-20">
                                    <div className="h-px flex-1 bg-white" />
                                    <span className="text-[10px] font-black">OU</span>
                                    <div className="h-px flex-1 bg-white" />
                                </div>
                                <button
                                    onClick={() => nickname && setView('join')}
                                    className={`btn-frosted border-white/20 hover:scale-105 active:scale-95 transition-all w-full max-w-md h-20 group ${nickname ? 'border-white/20' : 'opacity-20 cursor-not-allowed'}`}
                                >
                                    <span className="relative z-10 font-black underline underline-offset-8 decoration-white/20 decoration-2">REJOINDRE AVEC UN CODE</span>
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
                        className="w-full max-w-2xl glass-bento p-16 text-center space-y-12"
                    >
                        <div className="space-y-4">
                            <h2 className="title-magazine !text-6xl italic !text-center">Prêt ?</h2>
                            <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto font-medium">
                                TU ES SUR LE POINT DE LANÇER UNE SESSION D'ANALYSE SOCIALE POUR LE SUJET <span className="text-white font-black">{nickname}</span>.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => onCreate(nickname)}
                                className="btn-frosted !bg-white !text-black h-20 w-full max-w-md !rounded-[40px] shadow-[0_30px_60px_-15px_rgba(255,255,255,0.4)]"
                            >
                                INITIALISER LA SESSION
                            </button>
                            <button
                                onClick={() => setView('root')}
                                className="text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity tracking-[0.3em] mt-4"
                            >
                                RETOUR AU TERMINAL
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
                        className="w-full max-w-2xl glass-bento p-16 flex flex-col items-center space-y-12"
                    >
                        <div className="text-center space-y-3">
                            <h2 className="title-magazine !text-6xl italic !text-center">Code d'accès</h2>
                            <p className="text-white/20 text-[10px] tracking-widest font-black uppercase tracking-[0.5em]">Autorisation Requise</p>
                        </div>

                        <input
                            type="text"
                            maxLength={4}
                            placeholder="0000"
                            className="input-elite input-glow max-w-md text-center text-5xl md:text-7xl font-black tracking-[0.4em] placeholder:text-white/5 py-10 rounded-[30px]"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />

                        <div className="flex flex-col items-center gap-4 w-full">
                            <button
                                onClick={() => onJoin(nickname, roomCode)}
                                className={`btn-frosted h-20 w-full max-w-md !rounded-[40px] ${roomCode.length === 4 ? '!bg-white !text-black' : 'opacity-20 cursor-not-allowed'}`}
                                disabled={roomCode.length !== 4}
                            >
                                SYNCHRONISER
                            </button>
                            <button
                                onClick={() => setView('root')}
                                className="text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity tracking-[0.3em] mt-4"
                            >
                                ANNULER
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>

            <div className="fixed bottom-12 flex gap-12 opacity-10 pointer-events-none">
                <span className="text-[8px] font-black uppercase tracking-[0.8em]">Privacy encrypted</span>
                <span className="text-[8px] font-black uppercase tracking-[0.8em]">BC-2026-X</span>
            </div>
        </div>
    );
}
