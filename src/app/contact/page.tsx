'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleWhatsAppRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = '22951563219';
    const text = `*Message via Loving App*%0A%0A*Nom:* ${name}%0A*Message:* ${message}`;
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-12 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Button>
        </Link>

        <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-card/40 backdrop-blur-md">
          <CardHeader className="text-center space-y-4 pb-8 border-b">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Icons.logo className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">Contactez-nous</CardTitle>
            <CardDescription>Une question ? Besoin d'aide ? Nos administrateurs sont là pour vous.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleWhatsAppRedirect} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Votre Nom</label>
                <Input 
                  placeholder="Ex: Jean Dupont" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Votre Message</label>
                <Textarea 
                  placeholder="Comment pouvons-nous vous aider ?" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  required
                  className="min-h-[150px] rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 gap-2">
                <MessageSquare className="w-5 h-5" />
                Envoyer sur WhatsApp
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground italic">
            En cliquant sur envoyer, vous serez redirigé vers notre support officiel sur WhatsApp.
        </p>
      </div>
    </div>
  );
}
