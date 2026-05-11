'use client';

import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CALL_LOGS = [
    { name: "Jessica", type: "video", status: "incoming", date: "Hier, 22:15" },
    { name: "Marie", type: "audio", status: "outgoing", date: "Hier, 19:40" },
    { name: "Sarah", type: "audio", status: "missed", date: "Lundi, 14:02" },
];

export function CallsTab() {
  return (
    <div className="p-4 space-y-6">
        <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Appels Récents</h4>
        </div>

        <div className="space-y-2">
            {CALL_LOGS.map((call, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-2xl transition-all">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                             <Avatar className="h-12 w-12 border-2 border-primary/5">
                                <AvatarFallback>{call.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-background",
                                call.status === 'missed' ? "bg-red-500" : "bg-green-500"
                            )}>
                                {call.status === 'incoming' && <PhoneIncoming className="w-2.5 h-2.5 text-white" />}
                                {call.status === 'outgoing' && <PhoneOutgoing className="w-2.5 h-2.5 text-white" />}
                                {call.status === 'missed' && <PhoneMissed className="w-2.5 h-2.5 text-white" />}
                            </div>
                        </div>
                        <div>
                            <p className={cn("font-bold text-sm", call.status === 'missed' && "text-red-500")}>{call.name}</p>
                            <p className="text-[10px] text-muted-foreground">{call.date}</p>
                        </div>
                    </div>
                    {call.type === 'video' ? <Video className="w-5 h-5 text-primary opacity-60" /> : <Phone className="w-5 h-5 text-primary opacity-60" />}
                </div>
            ))}
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground italic px-6 mt-10">
            Les appels sur Loving sont sécurisés et ne partagent jamais votre numéro de téléphone réel.
        </p>
    </div>
  );
}

import { cn } from '@/lib/utils';
