'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Share2, Users, HelpCircle, Trophy, X, Globe, Copy, Check, Info, Award } from 'lucide-react';

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
    const [allVotes, setAllVotes] = useState<Record<string, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [revealWinner, setRevealWinner] = useState<Player | null>(null);
    const [voted, setVoted] = useState(false);
    const [lang, setLang] = useState<Lang>('fr');
    const [showRules, setShowRules] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const channel = supabase.channel(`room:${roomCode}`)
            .on('broadcast', { event: 'next_question' }, (payload) => {
                setCurrentQuestion(payload.question);
                setShowResults(false);
                setVoted(false);
                setSelectedPlayerId(null);
                setRevealWinner(null);
                setAllVotes({});
            })
            .on('broadcast', { event: 'show_results' }, (payload) => {
                setAllVotes(payload.votes);
                setShowResults(true);
                const counts = payload.votes;
                const winnerId = Object.keys(counts).reduce((a, b) => (counts[a] || 0) > (counts[b] || 0) ? a : b, '');
                const winner = players.find(p => p.id === winnerId);
                setTimeout(() => setRevealWinner(winner || null), 1500);
            })
            .on('broadcast', { event: 'vibrate_all' }, () => {
                if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
            })
            .subscribe();

        if (isHost && !currentQuestion) fetchNextQuestion();

        return () => { supabase.removeChannel(channel); };
    }, [roomCode, isHost, players]);

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
        if (window.navigator?.vibrate) window.navigator.vibrate(20);

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
            await supabase.channel(`room:${roomCode}`).send({ type: 'broadcast', event: 'vibrate_all' });
        }
    };

    return (
        <div className="flex flex-col items-center min-h-[100dvh] pt-32 pb-24 px-4 md:px-12 max-w-[1400px] mx-auto overflow-x-hidden w-full selection:bg-indigo-300">

            {/* HUD - Floating Command Deck */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-[100] w-full max-w-[95%] justify-between md:justify-center">
                <div className="flex gap-2">
                    <motion.div className="hud-glass" whileHover={{ scale: 1.05 }}>
                        <Users size={14} className="text-white/40" />
                        <span className="text-[10px] font-black tracking-widest opacity-30">ROOM /</span>
                        <span className="text-[10px] font-black">{roomCode}</span>
                    </motion.div>
                </div>

                <div className="flex gap-2">
                    <div className="glass-elite !p-1 !rounded-full hidden md:flex">
                        {(['fr', 'en', 'es'] as Lang[]).map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`text-[8px] font-black px-4 py-2 rounded-full transition-all ${lang === l ? 'bg-white text-black' : 'text-white/20 hover:text-white/40'}`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <motion.button
                        className="hud-glass !p-3"
                        onClick={() => setShowRules(true)}
                        whileHover={{ rotate: 15 }}
                    >
                        <Info size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Main Question - Bento Hero */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion?.id}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, filter: "blur(20px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full grid grid-cols-12 gap-6 mb-12"
                >
                    <div className="col-span-12 lg:col-span-8 glass-elite p-12 md:p-20 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                        <div className="absolute top-8 left-8 text-[10px] font-black tracking-[0.5em] opacity-10 uppercase">Social Experiment #BC26</div>
                        <motion.h2
                            className="title-gigantic text-center max-w-4xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {currentQuestion?.[lang] || '...'}
                        </motion.h2>
                        <div className="absolute bottom-8 right-8 flex gap-1 opacity-20">
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-8 h-1 rounded-full bg-white" />
                        </div>
                    </div>

                    <div className="hidden lg:flex col-span-4 glass-elite p-12 flex-col justify-between">
                        <div className="space-y-4">
                            <Globe size={40} className="text-white/10" />
                            <h3 className="text-2xl font-black uppercase tracking-tighter">ANALYSE EN COURS</h3>
                            <p className="text-white/30 text-xs leading-relaxed font-medium">Les données de vote sont cryptées et traitées en temps réel par les serveurs Supabase 2026. Répondez avec honnêteté brutale.</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black opacity-30 uppercase">Statut</div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">LIVE SYNC</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Players - Bento Grid 12 */}
            <div className="grid grid-cols-12 gap-4 w-full">
                {players.map((player, idx) => {
                    const voteCount = allVotes[player.id] || 0;
                    const percentage = players.length > 0 ? (voteCount / players.length) * 100 : 0;
                    const isSelected = selectedPlayerId === player.id;

                    // Asymmetric sizes logic
                    const isLarge = idx === 0 || idx === 5;
                    const spanClass = isLarge ? "col-span-12 md:col-span-6 lg:col-span-4" : "col-span-6 md:col-span-3 lg:col-span-2";

                    return (
                        <motion.div
                            layout
                            key={player.id}
                            onClick={() => handleVote(player.id)}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * idx, duration: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                            className={`${spanClass} h-[180px] md:h-[240px] glass-elite cursor-pointer group flex flex-col items-center justify-center gap-4 ${isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}
                        >
                            <AnimatePresence>
                                {showResults && (
                                    <motion.div
                                        className="liquid-loader"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${percentage}%` }}
                                        transition={{ type: "spring", bounce: 0, duration: 2, delay: 0.2 }}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative z-10 flex flex-col items-center transition-transform duration-500 group-hover:-translate-y-2">
                                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center glass-elite text-3xl font-black transition-all ${isSelected ? 'scale-110 !border-white/40' : 'group-hover:border-white/20'}`}>
                                    {player.nickname?.charAt(0).toUpperCase()}
                                </div>
                                <div className="mt-4 flex flex-col items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                                        {player.nickname}
                                    </span>
                                    {showResults && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-2xl font-black mt-1"
                                        >
                                            {Math.round(percentage)}%
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Host Action Center */}
            <AnimatePresence>
                {isHost && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xs z-50 px-4"
                    >
                        {!showResults ? (
                            <button
                                onClick={triggerResults}
                                className="btn-elite btn-solid !h-20 w-full !rounded-[40px] shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)]"
                            >
                                RÉVÉLER L'ANALYSE
                            </button>
                        ) : (
                            <button
                                onClick={fetchNextQuestion}
                                className="btn-elite btn-solid !h-20 w-full !rounded-[40px] !bg-indigo-500 !text-white !border-indigo-400/50 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)]"
                            >
                                EXPÉRIENCE SUIVANTE
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules Modal - Elite Overlay */}
            <AnimatePresence>
                {showRules && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass-elite p-12 md:p-16 max-w-lg w-full relative"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <button
                                className="absolute top-8 right-8 text-white/20 hover:text-white"
                                onClick={() => setShowRules(false)}
                            >
                                <X size={24} />
                            </button>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black tracking-tighter uppercase">RÈGLES DU JEU</h3>
                                    <div className="w-12 h-1 bg-white/10" />
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { t: "IDENTIFICATION", d: "Une situation est présentée par l'unité centrale." },
                                        { t: "SELECTION", d: "Votez pour le profil correspondant le mieux à la question." },
                                        { t: "SYNCHRONISATION", d: "Les résultats sont révélés et décident du sort du tour." }
                                    ].map((rule, i) => (
                                        <div key={i} className="flex gap-6 items-start">
                                            <span className="text-[10px] font-black opacity-20 mt-1">0{i + 1}</span>
                                            <div className="space-y-1">
                                                <div className="text-xs font-black tracking-widest">{rule.t}</div>
                                                <div className="text-sm text-white/40 leading-relaxed">{rule.d}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="btn-elite btn-solid w-full h-16"
                                    onClick={() => setShowRules(false)}
                                >
                                    ACCÉPTER LES DONNÉES
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Winner Overlay - Extreme Glitch */}
            <AnimatePresence>
                {revealWinner && (
                    <motion.div
                        className="fixed inset-0 z-[300] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="flex flex-col items-center text-center"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 1 }}
                        >
                            <motion.div
                                className="text-indigo-500 mb-8"
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                            >
                                <Award size={80} strokeWidth={1} />
                            </motion.div>
                            <h3 className="text-indigo-400 text-xs font-black tracking-[1em] mb-4 uppercase">MOST LIKELY</h3>
                            <h1 className="title-gigantic !text-7xl md:!text-[12rem] bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent mb-12">
                                {revealWinner.nickname}
                            </h1>

                            {isHost ? (
                                <button
                                    className="btn-elite btn-solid !h-24 px-16 !text-lg !rounded-[50px] shadow-[0_0_80px_-20px_#4F46E5]"
                                    onClick={fetchNextQuestion}
                                >
                                    EXPÉRIENCE SUIVANTE
                                </button>
                            ) : (
                                <div className="flex flex-col items-center gap-4 opacity-40">
                                    <div className="flex gap-2">
                                        {[0.1, 0.2, 0.3].map(d => (
                                            <motion.div key={d} className="w-1 h-8 bg-white" animate={{ height: [4, 32, 4] }} transition={{ repeat: Infinity, delay: d }} />
                                        ))}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em]">Synchronisation de l'Host</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Ambient Glitch backgrounds */}
                        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-magenta-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
