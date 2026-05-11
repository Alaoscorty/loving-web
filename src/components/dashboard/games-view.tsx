
'use client';

import { useUser } from '@/firebase';
import ManGamesPage from '@/app/dashboard/man/my-games/page';
import WomanGamesPage from '@/app/dashboard/woman/games/page';

export function GamesView() {
    const { userProfile } = useUser();

    if (userProfile?.role === 'man') {
        return <ManGamesPage />;
    }

    if (userProfile?.role === 'woman') {
        return <WomanGamesPage />;
    }

    return null;
}
