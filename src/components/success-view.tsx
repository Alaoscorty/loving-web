
'use client';

import { CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

type SuccessViewProps = {
  title: string;
  message: string;
  onBack: () => void;
  buttonText?: string;
};

export function SuccessView({ title, message, onBack, buttonText = "Retour au tableau de bord" }: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative bg-primary/10 p-8 rounded-full border-4 border-primary/20">
          <CheckCircle2 className="w-20 h-20 text-primary" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-bounce" />
      </div>

      <div className="space-y-3 px-4">
        <h2 className="text-3xl font-bold font-headline tracking-tighter">{title}</h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <Button 
        onClick={onBack} 
        size="lg"
        className="h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 gap-2"
      >
        <ChevronLeft className="w-5 h-5" />
        {buttonText}
      </Button>
    </div>
  );
}
