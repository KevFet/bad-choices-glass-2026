'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LobbyProps {
    onJoin: (nickname: string, code: string) => void;
    onCreate: (nickname: string) => void;
}

export default function Lobby({ onJoin, onCreate }: LobbyProps) {
    const [nickname, setNickname] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [view, setView] = useState<'root' | 'join' | 'create'>('root');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 relative overflow-hidden">

            {/* Centered Magazine HUD */}
            <motion.div
                className="mb-16 md:mb-24 text-center z-20"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
            >
                <span className="block text-[11px] uppercase font-black tracking-[0.7em] opacity-30 mb-3">Experimental Protocol / 2026-X</span>
                <h1 className="title-magazine text-center !text-8xl md:!text-[12rem]">
                    BAD<br />CHOICES
                </h1>
            </motion.div>

            <AnimatePresence mode="wait">

                {view === 'root' && (
                    <motion.div
                        key="root"
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -20, filter: "blur(20px)" }}
                        transition={{ duration: 0.8 }}
                        className="w-full max-w-2xl glass-bento p-10 md:p-16 flex flex-col items-center justify-center gap-10 z-20"
                    >
                        <div className="w-full flex flex-col items-center gap-6">
                            <div className="flex flex-col items-center gap-2 w-full mb-4">
                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-center">Identité du Sujet</span>
                                <input
                                    type="text"
                                    placeholder="TON PSEUDO"
                                    className="w-full max-w-md bg-white/5 border-[0.5px] border-white/10 rounded-2xl h-16 text-center text-lg font-black tracking-widest placeholder:text-white/10 focus:bg-white/10 focus:border-white/30 transition-all outline-none"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="flex flex-col gap-5 w-full items-center">
                                <button
                                    onClick={() => nickname && setView('create')}
                                    className={`btn-frosted w-full max-w-md h-20 group rounded-2xl flex items-center justify-center transition-all ${nickname ? 'opacity-100' : 'opacity-20 cursor-not-allowed'}`}
                                >
                                    <span className="font-black text-xs tracking-[0.4em]">CRÉER UNE SALLE</span>
                                </button>
                                <div className="flex items-center gap-4 w-full max-w-md opacity-20">
                                    <div className="h-px flex-1 bg-white" />
                                    <span className="text-[10px] font-black">OR</span>
                                    <div className="h-px flex-1 bg-white" />
                                </div>
                                <button
                                    onClick={() => nickname && setView('join')}
                                    className={`btn-frosted w-full max-w-md h-20 group rounded-2xl flex items-center justify-center transition-all border-dashed ${nickname ? 'opacity-100' : 'opacity-20 cursor-not-allowed'}`}
                                >
                                    <span className="font-black text-xs tracking-[0.4em]">REJOINDRE</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'join' && (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="w-full max-w-2xl glass-bento p-16 flex flex-col items-center space-y-12 z-20"
                    >
                        <div className="text-center space-y-3">
                            <h2 className="title-magazine !text-6xl italic">Accès Salle</h2>
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">Synchronisation Requise</p>
                        </div>

                        <input
                            type="text"
                            maxLength={4}
                            placeholder="0000"
                            className="w-full max-w-md bg-white/5 border-[0.5px] border-white/10 rounded-[30px] py-10 text-center text-5xl md:text-7xl font-black tracking-[0.4em] placeholder:text-white/5 focus:bg-white/10 focus:border-white/30 transition-all outline-none"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />

                        <div className="flex flex-col items-center gap-4 w-full">
                            <button
                                onClick={() => onJoin(nickname, roomCode)}
                                className={`btn-frosted h-20 w-full max-w-md rounded-[40px] flex items-center justify-center ${roomCode.length === 4 ? 'bg-white text-black' : 'opacity-20 cursor-not-allowed'}`}
                                disabled={roomCode.length !== 4}
                            >
                                SYNCHRONISER
                            </button>
                            <button
                                onClick={() => setView('root')}
                                className="text-[10px] font-black uppercase opacity-40 hover:opacity-100 tracking-[0.3em] mt-8"
                            >
                                RETOUR
                            </button>
                        </div>
                    </motion.div>
                )}

                {view === 'create' && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="w-full max-w-2xl glass-bento p-16 text-center space-y-12 z-20"
                    >
                        <div className="space-y-4">
                            <h2 className="title-magazine !text-6xl italic">Session</h2>
                            <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto font-medium">Initialisation du protocole pour <span className="text-white font-black">{nickname}</span>.</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => onCreate(nickname)}
                                className="btn-frosted bg-white text-black h-20 w-full max-w-md rounded-[40px] shadow-[0_30px_60px_-15px_rgba(255,255,255,0.4)]"
                            >
                                INITIALISER
                            </button>
                            <button
                                onClick={() => setView('root')}
                                className="text-[10px] font-black uppercase opacity-40 tracking-[0.3em] mt-8"
                            >
                                ANNULER
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>

            <div className="fixed bottom-12 flex gap-12 opacity-10 pointer-events-none z-10 w-full justify-center">
                <span className="text-[8px] font-black uppercase tracking-[0.8em]">Privacy encrypted</span>
                <span className="text-[8px] font-black uppercase tracking-[0.8em]">BC-2026-X</span>
            </div>
        </div>
    );
}
