'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Camera, PhoneIncoming } from 'lucide-react';
import { cn } from '@/lib/utils';

type CallSimulationProps = {
  type: 'audio' | 'video';
  targetProfile: {
    name: string;
    photoUrl?: string;
  };
  onClose: () => void;
};

export function CallSimulation({ type, targetProfile, onClose }: CallSimulationProps) {
  const [status, setStatus] = useState<'calling' | 'connected'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'audio');

  useEffect(() => {
    // Simuler une connexion après 3 secondes
    const timeout = setTimeout(() => {
      setStatus('connected');
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#0b141a] text-white animate-in fade-in duration-500">
      {/* Background effect for Video Call */}
      {type === 'video' && !isVideoOff && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0">
             <div className="w-full h-full bg-muted/20 animate-pulse flex items-center justify-center">
                <Camera className="w-20 h-20 text-white/10" />
             </div>
          </div>
      )}

      <header className="relative z-10 w-full p-10 flex flex-col items-center text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4 text-primary">
            {type === 'video' ? 'Appel Vidéo' : 'Appel Vocal'}
        </p>
        
        <div className="relative mb-6">
            <div className={cn(
                "absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse",
                status === 'calling' ? "opacity-100" : "opacity-0"
            )} />
            <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl relative">
                <AvatarImage src={targetProfile.photoUrl} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold bg-muted text-foreground">{targetProfile.name[0]}</AvatarFallback>
            </Avatar>
        </div>

        <h2 className="text-3xl font-bold font-headline mb-2">{targetProfile.name}</h2>
        <p className={cn(
            "text-sm font-medium transition-all duration-500",
            status === 'calling' ? "text-primary animate-pulse" : "text-green-500"
        )}>
            {status === 'calling' ? 'Appel en cours...' : formatDuration(duration)}
        </p>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-10">
          {type === 'video' && status === 'connected' && !isVideoOff && (
              <div className="absolute bottom-32 right-10 w-24 h-40 bg-card rounded-xl border-2 border-primary/40 shadow-2xl overflow-hidden animate-in slide-in-from-right-10">
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
              </div>
          )}
      </main>

      <footer className="relative z-10 w-full max-w-md pb-20 px-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 flex items-center justify-around border border-white/10 shadow-2xl">
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-14 w-14 rounded-full transition-colors", isMuted ? "bg-white text-black" : "bg-white/10 text-white")}
                onClick={() => setIsMuted(!isMuted)}
            >
                {isMuted ? <MicOff /> : <Mic />}
            </Button>

            {type === 'video' ? (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-14 w-14 rounded-full transition-colors", isVideoOff ? "bg-white text-black" : "bg-white/10 text-white")}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                >
                    {isVideoOff ? <VideoOff /> : <Video />}
                </Button>
            ) : (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-14 w-14 rounded-full transition-colors", isSpeaker ? "bg-white text-black" : "bg-white/10 text-white")}
                    onClick={() => setIsSpeaker(!isSpeaker)}
                >
                    {isSpeaker ? <VolumeX /> : <Volume2 />}
                </Button>
            )}

            <Button 
                variant="destructive" 
                size="icon" 
                className="h-16 w-16 rounded-full shadow-2xl shadow-destructive/40 hover:scale-110 active:scale-95 transition-transform"
                onClick={onClose}
            >
                <PhoneOff className="h-8 w-8" />
            </Button>
        </div>
        
        <p className="text-[9px] text-center mt-8 text-white/40 uppercase font-bold tracking-widest">
            Crypté de bout en bout
        </p>
      </footer>
    </div>
  );
}
