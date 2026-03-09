'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Users, HelpCircle, Trophy, X, Globe, Copy, Check } from 'lucide-react';

interface Player {
    id: string;
    nickname: string;
    avatar_url: string;
    is_host: boolean;
    vote_count?: number;
    percentage?: number;
}

interface Question {
    id: string;
    fr: string;
    en: string;
    es: string;
}

interface GameProps {
    roomCode: string;
    myId: string;
    players: Player[];
    isHost: boolean;
    onLeave: () => void;
}

type Lang = 'fr' | 'en' | 'es';

export default function Game({ roomCode, myId, players, isHost, onLeave }: GameProps) {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [allVotes, setAllVotes] = useState<any>([]);
    const [showResults, setShowResults] = useState(false);
    const [revealWinner, setRevealWinner] = useState<Player | null>(null);
    const [voted, setVoted] = useState(false);
    const [lang, setLang] = useState<Lang>('fr');
    const [showRules, setShowRules] = useState(false);
    const [copied, setCopied] = useState(false);

    // Sync state with Supabase Realtime
    useEffect(() => {
        const channel = supabase.channel(`room:${roomCode}`)
            .on('broadcast', { event: 'next_question' }, (payload) => {
                setCurrentQuestion(payload.question);
                setShowResults(false);
                setVoted(false);
                setSelectedPlayerId(null);
                setRevealWinner(null);
                setAllVotes([]);
            })
            .on('broadcast', { event: 'show_results' }, (payload) => {
                setAllVotes(payload.votes);
                setShowResults(true);

                // Find winner locally
                const counts = payload.votes;
                const winnerId = Object.keys(counts).reduce((a, b) => (counts[a] || 0) > (counts[b] || 0) ? a : b, '');
                const winner = players.find(p => p.id === winnerId);
                setTimeout(() => setRevealWinner(winner || null), 2000);
            })
            .on('broadcast', { event: 'vibrate_all' }, () => {
                if (window.navigator?.vibrate) window.navigator.vibrate([50, 50, 50]);
            })
            .subscribe();

        if (isHost && !currentQuestion) fetchNextQuestion();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomCode, isHost]);

    const fetchNextQuestion = async () => {
        const { data: questions } = await supabase.from('bad_choices_questions').select('*');
        if (questions && questions.length > 0) {
            const randomQ = questions[Math.floor(Math.random() * questions.length)];
            setCurrentQuestion(randomQ);
            await supabase.channel(`room:${roomCode}`).send({
                type: 'broadcast',
                event: 'next_question',
                question: randomQ,
            });
            await supabase.from('bad_choices_rooms').update({ current_question_id: randomQ.id }).eq('code', roomCode);
        }
    };

    const handleVote = async (playerId: string) => {
        if (voted || showResults) return;
        setVoted(true);
        setSelectedPlayerId(playerId);

        if (window.navigator?.vibrate) window.navigator.vibrate(50);

        await supabase.from('bad_choices_votes').insert({
            room_code: roomCode,
            question_id: currentQuestion?.id,
            voter_id: myId,
            voted_for_id: playerId,
        });
    };

    const triggerResults = async () => {
        const { data: votes } = await supabase.from('bad_choices_votes')
            .select('voted_for_id')
            .match({ room_code: roomCode, question_id: currentQuestion?.id });

        if (votes) {
            const counts: Record<string, number> = {};
            votes.forEach(v => counts[v.voted_for_id] = (counts[v.voted_for_id] || 0) + 1);

            await supabase.channel(`room:${roomCode}`).send({
                type: 'broadcast',
                event: 'show_results',
                votes: counts,
            });

            // Also trigger a vibration for everyone
            await supabase.channel(`room:${roomCode}`).send({
                type: 'broadcast',
                event: 'vibrate_all',
            });
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center min-h-[100dvh] p-4 md:p-6 max-w-4xl mx-auto pt-24 pb-12 overflow-hidden">

            {/* HUD High-End */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-[60] safe-top">
                <div className="flex gap-2">
                    <motion.div
                        className="glass flex items-center px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest gap-2"
                        whileHover={{ scale: 1.05 }}
                    >
                        <Users size={12} className="text-cyan-400" />
                        <span className="opacity-60">PLAYERS:</span> {players.length}
                    </motion.div>
                    <motion.div
                        className="glass flex items-center px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer"
                        onClick={copyRoomCode}
                        whileTap={{ scale: 0.95 }}
                    >
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-magenta-400" />}
                        <span className="opacity-60">CODE:</span> {roomCode}
                    </motion.div>
                </div>

                <div className="flex gap-2">
                    <motion.button
                        className="glass !p-2 rounded-full text-white/60 hover:text-white"
                        onClick={() => setShowRules(true)}
                        whileHover={{ rotate: 15 }}
                    >
                        <HelpCircle size={18} />
                    </motion.button>
                    <div className="glass flex items-center p-1 rounded-full gap-1">
                        {(['fr', 'en', 'es'] as Lang[]).map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`text-[9px] font-bold px-2 py-1 rounded-full transition-all ${lang === l ? 'bg-white text-black' : 'text-white/40'}`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Question Display */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion?.id}
                    className="glass p-8 md:p-14 rounded-[40px] w-full text-center mb-10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[250px] border-white/5"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                    transition={{ type: "spring", damping: 20 }}
                >
                    <div className="absolute top-4 left-6 text-white/5 text-5xl md:text-7xl font-black italic select-none pointer-events-none">CHOICE</div>
                    <motion.h2
                        className="text-2xl md:text-5xl font-black mb-6 leading-[1.1] tracking-tight"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {currentQuestion?.[lang] || '...'}
                    </motion.h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-full opacity-50" />
                </motion.div>
            </AnimatePresence>

            {/* Players Bento Grid */}
            <div className="bento-grid max-w-2xl mx-auto w-full px-2">
                {players.map((player, idx) => {
                    const voteCount = allVotes[player.id] || 0;
                    const percentage = players.length > 0 ? (voteCount / players.length) * 100 : 0;
                    const isWinner = revealWinner?.id === player.id;
                    const isSelected = selectedPlayerId === player.id;

                    return (
                        <motion.div
                            layout
                            key={player.id}
                            onClick={() => handleVote(player.id)}
                            className={`bento-item glass glass-interactive relative group ${isSelected ? 'active neon-halo' : ''} ${isWinner ? 'glow-magenta scale-105 z-10' : ''}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05, type: "spring" }}
                            whileTap={{ scale: 0.92 }}
                        >
                            <AnimatePresence>
                                {showResults && (
                                    <motion.div
                                        className="liquid-progress"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${percentage}%` }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative z-20 flex flex-col items-center">
                                <div className={`text-2xl mb-2 h-14 w-14 rounded-full flex items-center justify-center backdrop-blur-3xl transition-all duration-500 ${isWinner ? 'bg-magenta-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                    {player.nickname?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest text-center transition-opacity ${showResults && percentage < 20 ? 'opacity-40' : 'opacity-100'}`}>
                                    {player.nickname}
                                </span>

                                {showResults && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-1 font-black text-xl text-white"
                                    >
                                        {voteCount > 0 ? `${Math.round(percentage)}%` : '0%'}
                                    </motion.div>
                                )}
                            </div>

                            {isWinner && <div className="glitch-lines" />}
                        </motion.div>
                    );
                })}
            </div>

            {/* Action Area */}
            <div className="mt-12 w-full max-w-xs space-y-4">
                {isHost && !showResults && !voted && players.length > 1 && (
                    <motion.button
                        className="w-full bg-white/10 text-white border border-white/20 uppercase text-xs font-black tracking-widest py-4 rounded-2xl"
                        onClick={triggerResults}
                        whileHover={{ scale: 1.02 }}
                    >
                        TERMINER LES VOTES
                    </motion.button>
                )}

                {isHost && showResults && (
                    <motion.button
                        className="w-full bg-white text-black uppercase text-xs font-black tracking-widest py-5 rounded-2xl shadow-2xl"
                        onClick={fetchNextQuestion}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        QUESTION SUIVANTE
                    </motion.button>
                )}
            </div>

            {/* Rules Modal */}
            <AnimatePresence>
                {showRules && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass p-10 rounded-[40px] max-w-sm w-full relative border-white/10"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <button
                                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white"
                                onClick={() => setShowRules(false)}
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="bg-cyan-500/20 p-4 rounded-3xl mb-6">
                                    <HelpCircle size={40} className="text-cyan-400" />
                                </div>
                                <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">RÈGLES</h3>
                                <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                                    <p><span className="text-white font-bold">1. UNE QUESTION :</span> Une situation est posée à tout le groupe.</p>
                                    <p><span className="text-white font-bold">2. UN COUPABLE :</span> Vote pour l'un des joueurs présent dans la salle.</p>
                                    <p><span className="text-white font-bold">3. LA RÉVÉLATION :</span> Les résultats s'affichent. Le plus voté est le grand gagnant (ou perdant) !</p>
                                </div>
                                <button
                                    className="mt-8 w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs"
                                    onClick={() => setShowRules(false)}
                                >
                                    J'AI COMPRIS
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Winner Overlay */}
            <AnimatePresence>
                {revealWinner && (
                    <motion.div
                        className="fixed inset-0 z-[110] flex items-center justify-center p-8 backdrop-blur-2xl bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass p-12 rounded-[50px] text-center relative max-w-lg w-full glow-magenta border-magenta-500/30"
                            initial={{ scale: 0.8, rotate: -5 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", bounce: 0.6 }}
                        >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">👑</div>
                            <h3 className="title-massive text-4xl mb-6 opacity-40">MOST LIKELY</h3>
                            <div className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                                {revealWinner.nickname}
                            </div>
                            <div className="h-1 w-full bg-magenta-500/20 rounded-full mb-8 overflow-hidden">
                                <motion.div
                                    className="h-full bg-magenta-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1 }}
                                />
                            </div>

                            {isHost ? (
                                <button
                                    className="bg-white text-black w-full py-6 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl"
                                    onClick={fetchNextQuestion}
                                >
                                    CONTINUER
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-magenta-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-2 h-2 bg-magenta-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-magenta-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Waiting for Host</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
