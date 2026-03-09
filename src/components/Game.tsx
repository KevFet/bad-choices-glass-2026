'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Users, HelpCircle, Trophy } from 'lucide-react';

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

export default function Game({ roomCode, myId, players, isHost, onLeave }: GameProps) {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [allVotes, setAllVotes] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [revealWinner, setRevealWinner] = useState<Player | null>(null);
    const [voted, setVoted] = useState(false);
    const [timer, setTimer] = useState<number>(30);

    // Sync state with Supabase Realtime
    useEffect(() => {
        const channel = supabase.channel(`room:${roomCode}`)
            .on('broadcast', { event: 'next_question' }, (payload) => {
                setCurrentQuestion(payload.question);
                setShowResults(false);
                setVoted(false);
                setSelectedPlayerId(null);
                setRevealWinner(null);
            })
            .on('broadcast', { event: 'show_results' }, (payload) => {
                setAllVotes(payload.votes);
                setShowResults(true);
            })
            .subscribe();

        if (isHost) fetchNextQuestion();

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
            // Set the question in DB
            await supabase.from('bad_choices_rooms').update({ current_question_id: randomQ.id }).eq('code', roomCode);
        }
    };

    const handleVote = async (playerId: string) => {
        if (voted || showResults) return;
        setVoted(true);
        setSelectedPlayerId(playerId);

        // Haptic feedback simulation
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

            const winnerId = Object.keys(counts).reduce((a, b) => (counts[a] || 0) > (counts[b] || 0) ? a : b, '');
            const winner = players.find(p => p.id === winnerId);

            await supabase.channel(`room:${roomCode}`).send({
                type: 'broadcast',
                event: 'show_results',
                votes: counts,
            });

            setAllVotes(Object.entries(counts).map(([id, count]) => ({ id, count })));
            setShowResults(true);
            setTimeout(() => setRevealWinner(winner || null), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-6 max-w-4xl mx-auto pt-20">

            {/* Header Info */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
                <div className="glass flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest gap-2">
                    USERS: <span className="text-cyan-400">{players.length}</span>
                </div>
                <div className="glass flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest gap-2">
                    ROOM: <span className="text-[#d946ef]">{roomCode}</span>
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion?.id}
                    className="glass p-12 rounded-[40px] w-full text-center mb-12 shadow-2xl relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ type: "spring", damping: 15 }}
                >
                    <div className="absolute top-4 left-6 text-white/20 text-4xl font-black italic">WHO?</div>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                        {currentQuestion?.fr}
                    </h2>
                    <p className="text-white/40 text-sm italic">{currentQuestion?.en}</p>
                </motion.div>
            </AnimatePresence>

            {/* Players Bento Grid */}
            <div className="bento-grid">
                {players.map((player, idx) => {
                    const voteEntry = Array.isArray(allVotes)
                        ? (allVotes.find((v: any) => v.id === player.id) || { count: 0 })
                        : (typeof allVotes === 'object' ? { count: allVotes[player.id || ''] || 0 } : { count: 0 });

                    const voteCount = (voteEntry as any).count || 0;
                    const percentage = players.length > 0 ? (voteCount / players.length) * 100 : 0;
                    const isWinner = revealWinner?.id === player.id;

                    return (
                        <motion.div
                            layout
                            key={player.id}
                            onClick={() => handleVote(player.id)}
                            className={`bento-item glass glass-interactive ${selectedPlayerId === player.id ? 'active neon-halo' : ''} ${isWinner ? 'shadow-[0_0_40px_rgba(217,70,239,0.3)] border-[#d946ef]' : ''}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Liquid Progress */}
                            {showResults && (
                                <div
                                    className="liquid-progress"
                                    style={{ height: `${percentage}%` }}
                                />
                            )}

                            <div className="text-4xl mb-2 opacity-80 h-16 w-16 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-md">
                                {player.nickname ? player.nickname.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-center">{player.nickname}</span>

                            {showResults && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-2 font-black text-2xl"
                                >
                                    {voteCount}
                                </motion.div>
                            )}

                            {/* Winner Glitch Effect */}
                            {isWinner && (
                                <div className="absolute inset-0 pointer-events-none glitch-lines" />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Host Controls */}
            {isHost && showResults && (
                <motion.div
                    className="mt-12 w-full max-w-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        className="w-full bg-magenta-500 bg-white"
                        onClick={fetchNextQuestion}
                    >
                        QUESTION SUIVANTE
                    </button>
                </motion.div>
            )}

            {/* Reveal Modal */}
            <AnimatePresence>
                {revealWinner && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-xl bg-black/40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass p-12 rounded-[50px] text-center relative max-w-lg w-full"
                            initial={{ scale: 0, rotate: 10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                        >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl">👑</div>
                            <h3 className="title-massive text-5xl mb-6">COUPABLE !</h3>
                            <div className="text-7xl font-black mb-4 uppercase glitch-text" data-text={revealWinner.nickname}>
                                {revealWinner.nickname}
                            </div>
                            <p className="text-white/60 mb-8">Tout le monde le savait...</p>
                            {isHost ? (
                                <button className="bg-white w-full py-6 rounded-3xl" onClick={fetchNextQuestion}>CONTINUER</button>
                            ) : (
                                <p className="font-bold italic animate-pulse">En attente de l'hôte...</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-20 glass p-6 rounded-3xl text-center max-w-sm">
                <h4 className="font-bold mb-2 flex items-center justify-center gap-2">
                    <HelpCircle size={16} /> RÈGLES DU JEU
                </h4>
                <p className="text-xs text-white/60">
                    Une question, un coupable. Vote pour celui qui correspond le mieux à la description. Préparez-vous à vous balancer !
                </p>
            </div>

            <style jsx>{`
        .bg-magenta-400 { color: #d946ef; }
        .bg-magenta-500 { background: #d946ef; }
        .text-magenta-400 { color: #d946ef; }
        
        .glitch-text {
          position: relative;
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        .glitch-text::before {
          color: #ff00ff;
          animation: glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
        }
        .glitch-text::after {
          color: #00ffff;
          animation: glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse both infinite;
        }
        
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(-3px, -3px); }
          60% { transform: translate(3px, 3px); }
          80% { transform: translate(3px, -3px); }
          100% { transform: translate(0); }
        }
      `}</style>
        </div>
    );
}
