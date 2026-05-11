'use client';

import { useUser } from '@/firebase';
import { WomanProfileForm } from '@/components/woman-profile-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ProfilePageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    {/* Skeleton for AI assistant */}
                    <Card className="bg-card/50 border-dashed">
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-3/4 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-1/3" />
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
             <div className="flex justify-end">
                <Skeleton className="h-10 w-48" />
            </div>
        </div>
    );
}


export default function WomanProfilePage() {
    const { userProfile, loading } = useUser();
    
    return (
        <div className="flex-1 p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline text-woman-primary">Mon Profil</h1>
                <p className="text-muted-foreground mt-1">Gérez vos informations et rendez votre profil attractif.</p>
            </header>

            {loading && <ProfilePageSkeleton />}
            
            {!loading && userProfile && userProfile.role === 'woman' && (
                <WomanProfileForm userProfile={userProfile} />
            )}

            {!loading && (!userProfile || userProfile.role !== 'woman') && (
                 <div className="text-center col-span-full py-10 px-4 rounded-md border border-dashed">
                    <h3 className="font-semibold">Accès non autorisé</h3>
                    <p className="text-sm text-muted-foreground">Cette page est réservée aux utilisatrices.</p>
                </div>
            )}
        </div>
    );
}
