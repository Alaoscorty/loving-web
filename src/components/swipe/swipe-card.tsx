
'use client';

import Image from 'next/image';
import { UserProfile } from '@/types/user';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles, Briefcase } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Props = {
  profile: UserProfile & { id: string };
};

export function SwipeCard({ profile }: Props) {
  const womanPlaceholders = PlaceHolderImages.filter(p => p.id.startsWith('woman-profile-'));
  const photo = profile.photoUrl || womanPlaceholders[Math.floor(Math.random() * womanPlaceholders.length)].imageUrl;

  return (
    <Card className="relative w-full h-full rounded-[3rem] overflow-hidden border-none shadow-2xl bg-card">
      <Image 
        src={photo} 
        alt={profile.name} 
        fill 
        priority
        className="object-cover"
        sizes="450px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="absolute bottom-8 left-8 right-8 text-white space-y-4">
        <div className="flex items-center gap-3">
            <h2 className="text-4xl font-bold font-headline tracking-tighter">{profile.name}</h2>
            <Badge className="bg-man-primary text-white border-none rounded-full px-3">
                <Sparkles className="w-3 h-3 mr-1" /> {profile.level || 'Bronze'}
            </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium opacity-90">
            <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-man-primary" />
                {profile.city || 'Partout'}
            </div>
            {profile.profession && (
                <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-man-primary" />
                    {profile.profession}
                </div>
            )}
        </div>

        <p className="text-sm line-clamp-3 italic opacity-80 leading-relaxed">
            "{profile.bio || "Cette utilisatrice préfère rester mystérieuse..."}"
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
            {profile.hobbies?.slice(0, 3).map((hobby, i) => (
                <Badge key={i} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md rounded-full px-4 py-1">
                    {hobby}
                </Badge>
            ))}
        </div>
      </div>
    </Card>
  );
}
