'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Info } from 'lucide-react';

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
    const channelRef = useRef<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [allVotes, setAllVotes] = useState<Record<string, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [revealWinner, setRevealWinner] = useState<Player | null>(null);
    const [voted, setVoted] = useState(false);
    const [lang, setLang] = useState<Lang>('fr');
    const [showRules, setShowRules] = useState(false);
    const [voterIds, setVoterIds] = useState<string[]>([]);
    const [roomStatus, setRoomStatus] = useState<'LOBBY' | 'PLAYING'>('LOBBY');

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
                const winnerId = Object.keys(payload.votes).reduce((a, b) =>
                    (payload.votes[a] || 0) > (payload.votes[b] || 0) ? a : b, ''
                );
                const winner = players.find(p => p.id === winnerId);
                setTimeout(() => setRevealWinner(winner || null), 2000);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: room } = await supabase.from('bad_choices_rooms')
                        .select('status, current_question_id')
                        .eq('code', roomCode)
                        .single();

                    if (room) {
                        setRoomStatus(room.status as any);
                        if (room.current_question_id) {
                            const { data: q } = await supabase.from('bad_choices_questions')
                                .select('*')
                                .eq('id', room.current_question_id)
                                .single();
                            if (q) setCurrentQuestion(q);

                            // Also sync existing votes for this question
                            const { data: existingVotes } = await supabase.from('bad_choices_votes')
                                .select('voter_id')
                                .match({ room_code: roomCode, question_id: room.current_question_id });
                            if (existingVotes) setVoterIds(existingVotes.map(v => v.voter_id));
                        }
                    }
                }
            });

        // 3. Database Vote Listener (Realtime)
        const voteChannel = supabase.channel(`votes:${roomCode}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'bad_choices_votes',
                filter: `room_code=eq.${roomCode}`
            }, (payload) => {
                const newVoterId = payload.new.voter_id;
                setVoterIds(prev => prev.includes(newVoterId) ? prev : [...prev, newVoterId]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bad_choices_rooms',
                filter: `code=eq.${roomCode}`
            }, (payload) => {
                setRoomStatus(payload.new.status);
            })
            .subscribe();

        channelRef.current = channel;

        if (isHost && !currentQuestion) fetchNextQuestion();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(voteChannel);
        };
    }, [roomCode, isHost, players.length]);

    // Automatic results trigger for host
    useEffect(() => {
        if (isHost && !showResults && currentQuestion && voterIds.length >= players.length && players.length > 0) {
            // Small delay for fluidity
            const timer = setTimeout(() => triggerResults(), 800);
            return () => clearTimeout(timer);
        }
    }, [voterIds.length, players.length, isHost, showResults, currentQuestion]);

    const fetchNextQuestion = async () => {
        const { data: questions } = await supabase.from('bad_choices_questions').select('*');
        if (questions && questions.length > 0) {
            const randomQ = questions[Math.floor(Math.random() * questions.length)];
            setCurrentQuestion(randomQ);
            setVoterIds([]); // Local reset

            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'next_question',
                    question: randomQ,
                });
            }

            await supabase.from('bad_choices_rooms').update({ current_question_id: randomQ.id }).eq('code', roomCode);
        }
    };

    const startGame = async () => {
        if (!isHost) return;
        const { data: questions } = await supabase.from('bad_choices_questions').select('*');
        if (questions && questions.length > 0) {
            const randomQ = questions[Math.floor(Math.random() * questions.length)];
            setCurrentQuestion(randomQ);

            await supabase.from('bad_choices_rooms').update({
                status: 'PLAYING',
                current_question_id: randomQ.id
            }).eq('code', roomCode);

            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'next_question',
                    question: randomQ,
                });
            }
        }
    };

    const handleVote = async (playerId: string) => {
        if (voted || showResults) return;
        setVoted(true);
        setSelectedPlayerId(playerId);

        await supabase.from('bad_choices_votes').upsert({
            room_code: roomCode,
            question_id: currentQuestion?.id,
            voter_id: myId,
            voted_for_id: playerId,
        }, { onConflict: 'room_code,question_id,voter_id' });
    };

    const triggerResults = async () => {
        const { data: votes } = await supabase.from('bad_choices_votes')
            .select('voted_for_id')
            .match({ room_code: roomCode, question_id: currentQuestion?.id });

        const counts: Record<string, number> = {};
        if (votes) {
            votes.forEach(v => counts[v.voted_for_id] = (counts[v.voted_for_id] || 0) + 1);
        }

        // Even if zero votes, broadcast the event to clear UI
        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'show_results',
                votes: counts
            });
        }
    };

    return (
        <div className="flex flex-col items-center min-h-[100dvh] pt-44 pb-32 px-4 max-w-7xl mx-auto w-full overflow-x-hidden relative">

            {/* Magazine HUD */}
            <div className="fixed top-10 left-1/2 -translate-x-1/2 flex items-center justify-between w-full max-w-6xl px-10 z-[100]">
                <div className="glass-card px-6 py-3 flex items-center gap-4">
                    <Users size={16} className="text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Code</span>
                    <span className="text-lg font-black tracking-widest">{roomCode}</span>
                </div>

                <div className="flex gap-4">
                    <div className="glass-card p-1 rounded-full flex gap-1 items-center">
                        {(['fr', 'en', 'es'] as Lang[]).map(l => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                className={`text-[9px] font-black px-4 py-2 rounded-full transition-all ${lang === l ? 'bg-white text-black' : 'text-white/20 hover:text-white/40'}`}
                            >
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowRules(true)} className="glass-card !p-3 rounded-full">
                        <Info size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {roomStatus === 'LOBBY' ? (
                    <motion.div
                        key="lobby-view"
                        className="w-full max-w-5xl flex flex-col items-center gap-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="text-center space-y-6">
                            <h2 className="title-magazine !text-7xl md:!text-[10rem] italic opacity-10 leading-none">Salle d'attente</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.8em] opacity-40">Synchronisation des Sujets ({players.length})</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                            {players.map((player) => (
                                <motion.div
                                    key={player.id}
                                    layout
                                    className="glass-bento p-8 flex flex-col items-center gap-4 group"
                                >
                                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center glass-card border-white/20 font-black text-3xl">
                                        {player.nickname?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">
                                        {player.nickname}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {isHost && (
                            <button
                                onClick={startGame}
                                className="btn-frosted !h-24 !bg-white !text-black shadow-[0_40px_80px_-20px_rgba(255,255,255,0.4)] !rounded-[50px] font-black text-xs tracking-[0.5em] w-full max-w-md"
                            >
                                LANCER LE PROTOCOLE
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="game-view"
                        className="w-full flex flex-col items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Main Question - Centered Magazine Box */}
                        <motion.div
                            key={currentQuestion?.id}
                            className="w-full max-w-5xl glass-bento p-16 md:p-24 text-center mb-16 relative overflow-hidden"
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                            transition={{ duration: 1 }}
                        >
                            <motion.h2 className="title-magazine !text-5xl md:!text-8xl italic">
                                {currentQuestion?.[lang] || '...'}
                            </motion.h2>
                            <div className="absolute bottom-10 right-10 opacity-20">
                                <span className="text-[10px] uppercase font-black tracking-[0.4em]">Protocol #026</span>
                            </div>
                        </motion.div>

                        {/* Players Bento Stack */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                            {players.map((player) => {
                                const voteCount = allVotes[player.id] || 0;
                                const percentage = players.length > 0 ? (voteCount / players.length) * 100 : 0;
                                const isSelected = selectedPlayerId === player.id;
                                const hasVoted = voterIds.includes(player.id);

                                return (
                                    <motion.div
                                        layout
                                        key={player.id}
                                        onClick={() => handleVote(player.id)}
                                        className={`glass-bento p-8 flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden group hover:scale-105 transition-all duration-500 ${isSelected ? 'border-white/50 bg-white/5' : ''}`}
                                    >
                                        <AnimatePresence>
                                            {showResults && (
                                                <motion.div
                                                    className="absolute bottom-0 left-0 w-full bg-white/10"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${percentage}%` }}
                                                    transition={{ duration: 1.5 }}
                                                />
                                            )}
                                        </AnimatePresence>

                                        <div className="relative z-10 w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center glass-card border-white/20 font-black text-2xl md:text-4xl">
                                            {player.nickname?.charAt(0).toUpperCase()}
                                            {showResults && (
                                                <div className="absolute -bottom-2 glass-card px-3 py-1 text-[10px] font-black italic">{Math.round(percentage)}%</div>
                                            )}
                                            {!showResults && hasVoted && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-black"
                                                >
                                                    <div className="w-2 h-2 bg-black rounded-full" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <span className="relative z-10 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100">
                                            {player.nickname}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isHost && roomStatus === 'PLAYING' && (
                    <motion.div
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-[110]"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {!showResults ? (
                            <button onClick={triggerResults} className="btn-frosted !h-24 !bg-white !text-black shadow-[0_40px_80px_-20px_rgba(255,255,255,0.4)] !rounded-[50px] font-black text-xs tracking-[0.5em] w-full">DÉCRYPTER LES VOTES</button>
                        ) : (
                            <button onClick={fetchNextQuestion} className="btn-frosted !h-24 !bg-white !text-black shadow-[0_40px_80px_-20px_rgba(255,255,255,0.4)] !rounded-[50px] font-black text-xs tracking-[0.5em] w-full">SUIVANT</button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showRules && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full max-w-2xl glass-bento p-16 relative flex flex-col items-center"
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                        >
                            <button onClick={() => setShowRules(false)} className="absolute top-10 right-10 opacity-20 hover:opacity-100">
                                <X size={24} />
                            </button>
                            <h3 className="title-magazine !text-7xl mb-12 italic">Protocole</h3>
                            <div className="space-y-10 w-full max-w-md text-left">
                                {[
                                    { t: "STIMULUS", d: "Analyser la question posée par l'algorithme central." },
                                    { t: "SÉLECTION", d: "Désigner le sujet le plus probable selon vos biais." },
                                    { t: "RÉSULTAT", d: "Synthétiser l'inconscient du groupe." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-10 items-start group">
                                        <span className="text-[10px] font-black opacity-10 mt-1 italic group-hover:opacity-100">0{i + 1}</span>
                                        <div className="space-y-1">
                                            <div className="text-xs font-black tracking-[0.4em] mb-1">{step.t}</div>
                                            <p className="text-sm text-white/30 leading-relaxed font-medium">{step.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowRules(false)} className="btn-frosted !bg-white !text-black mt-16 h-20 !rounded-[40px] w-full">OK</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {revealWinner && (
                    <motion.div
                        className="fixed inset-0 z-[300] flex items-center justify-center p-12 bg-black/98 backdrop-blur-3xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4">
                                <span className="text-xs font-black uppercase tracking-[1em] block opacity-30">Le Vainqueur</span>
                                <h1 className="title-magazine !text-[12vw] leading-none mb-10">{revealWinner.nickname}</h1>
                            </motion.div>
                            {isHost && (
                                <button onClick={fetchNextQuestion} className="btn-frosted !bg-white !text-black h-24 px-20 !rounded-[60px]">CONTINUER</button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
