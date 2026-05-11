'use client';

import { useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatView } from '@/components/chat/ChatView';
import { NoConversationSelected } from '@/components/chat/NoConversationSelected';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, CircleDashed, Phone, Gift, ArrowLeft } from 'lucide-react';
import { StoryTab } from '../chat/StoryTab';
import { CallsTab } from '../chat/CallsTab';
import { DonateXpTab } from '../chat/DonateXpTab';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MessagesView() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <Card className="flex flex-col md:flex-row h-full rounded-2xl md:rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-card/40 backdrop-blur-md relative">
      {/* Sidebar de messagerie - Cachée sur mobile si une conversation est sélectionnée */}
      <aside className={cn(
          "w-full md:w-1/3 lg:w-[350px] border-r border-white/5 bg-background/20 flex flex-col h-full transition-all duration-300",
          selectedConversationId ? "hidden md:flex" : "flex"
      )}>
        <Tabs defaultValue="chats" className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 md:p-4 border-b border-white/5 bg-background/10">
                <TabsList className="grid grid-cols-4 bg-muted/50 rounded-xl md:rounded-2xl h-10 md:h-12 p-1">
                    <TabsTrigger value="chats" className="rounded-lg md:rounded-xl" title="Chats"><MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /></TabsTrigger>
                    <TabsTrigger value="stories" className="rounded-lg md:rounded-xl" title="Stories"><CircleDashed className="w-3.5 h-3.5 md:w-4 md:h-4" /></TabsTrigger>
                    <TabsTrigger value="calls" className="rounded-lg md:rounded-xl" title="Appels"><Phone className="w-3.5 h-3.5 md:w-4 md:h-4" /></TabsTrigger>
                    <TabsTrigger value="donate" className="rounded-lg md:rounded-xl" title="Dons XP"><Gift className="w-3.5 h-3.5 md:w-4 md:h-4" /></TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <TabsContent value="chats" className="m-0 focus-visible:outline-none">
                    <ConversationList
                        selectedConversationId={selectedConversationId}
                        onConversationSelect={setSelectedConversationId}
                    />
                </TabsContent>
                
                <TabsContent value="stories" className="m-0 focus-visible:outline-none">
                    <StoryTab />
                </TabsContent>

                <TabsContent value="calls" className="m-0 focus-visible:outline-none">
                    <CallsTab />
                </TabsContent>

                <TabsContent value="donate" className="m-0 focus-visible:outline-none">
                    <DonateXpTab selectedConversationId={selectedConversationId} />
                </TabsContent>
            </div>
        </Tabs>
      </aside>

      {/* Zone de Chat - Plein écran sur mobile si sélectionnée */}
      <main className={cn(
          "flex-1 h-full bg-background/10 flex flex-col",
          selectedConversationId ? "flex" : "hidden md:flex"
      )}>
        {selectedConversationId ? (
          <>
            {/* Bouton retour mobile dans le header du chat */}
            <div className="md:hidden absolute top-4 left-4 z-50">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full bg-background/40 backdrop-blur-md"
                    onClick={() => setSelectedConversationId(null)}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>
            <ChatView conversationId={selectedConversationId} key={selectedConversationId} />
          </>
        ) : (
          <NoConversationSelected />
        )}
      </main>
    </Card>
  );
}
