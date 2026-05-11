'use client';

import { useState, useMemo } from "react";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signOutUser, submitProfileRequest, SUB_PROFILE_EXTEND_FEE_FCFA, extendProfileLimit } from "@/lib/firebase-actions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, UserPlus, ShieldAlert, Sparkles, UserCircle, Loader2, CheckCircle2, MessageSquare, CreditCard, Star, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { userProfile, user, switchProfile } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRequesting, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [reason, setReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  // Récupérer les profils existants pour vérification
  const allProfilesQuery = useMemo(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'users'), where('ownerUid', '==', user.uid));
  }, [firestore, user]);

  const { data: myProfiles } = useCollection<any>(allProfilesQuery);

  const profilesCount = myProfiles?.length || 0;
  const maxProfiles = userProfile?.maxSubProfiles || 3;
  const canRequestMore = profilesCount < maxProfiles;

  const handleRequestProfile = async (role: 'man' | 'woman') => {
      if (!user || !firestore || !newName.trim() || !reason.trim()) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs.' });
          return;
      }
      setIsCreating(true);
      try {
          await submitProfileRequest({
              firestore,
              ownerUid: user.uid,
              role,
              name: newName,
              reason
          });
          toast({ title: 'Demande envoyée !', description: 'L\'administrateur examinera votre demande de profil supplémentaire.' });
          setNewName('');
          setReason('');
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'envoyer la demande.' });
      } finally {
          setIsCreating(false);
      }
  }

  const handleExtendLimit = async () => {
      if (!firestore || !user) return;
      setIsExtending(true);
      try {
          await extendProfileLimit(firestore, user.uid);
          toast({ title: 'Limite augmentée ! 🚀', description: 'Vous pouvez désormais posséder jusqu\'à 10 profils.' });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur' });
      } finally {
          setIsExtending(false);
      }
  }

  const handleSignOut = async () => {
    await signOutUser(auth);
    router.push('/login');
    toast({ title: 'Déconnexion', description: 'À bientôt sur Loving !' });
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">Gestion des Profils</h1>
        <p className="text-muted-foreground mt-1">Gérez vos identités et vos limites sur Loving.</p>
      </header>

      {/* Affichage du motif de refus si existant */}
      {userProfile?.verificationStatus === 'rejected' && userProfile.verificationRejectionReason && (
          <Alert variant="destructive" className="rounded-3xl border-none shadow-lg bg-destructive/10 animate-in slide-in-from-top-4 duration-700">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">Demande de Badge Refusée</AlertTitle>
            <AlertDescription className="mt-2 text-sm italic">
                Motif de l'administrateur : "{userProfile.verificationRejectionReason}"
            </AlertDescription>
          </Alert>
      )}

      <div className="space-y-6">
        <Card className="rounded-3xl shadow-xl overflow-hidden border-none bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <UserPlus className="text-primary" /> Demander un nouveau profil
            </CardTitle>
            <CardDescription>
                Vous avez actuellement {profilesCount}/{maxProfiles} profils utilisés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canRequestMore ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Nom du profil</label>
                        <Input 
                            placeholder="Ex: Mon Profil Secondaire" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="rounded-xl h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Raison de la demande</label>
                        <Textarea 
                            placeholder="Pourquoi souhaitez-vous créer un autre compte ?" 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="rounded-xl min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <Button 
                            className="h-14 rounded-2xl font-bold bg-man-primary hover:bg-man-primary/90 shadow-lg shadow-man-primary/20"
                            disabled={isRequesting || !newName.trim() || !reason.trim()}
                            onClick={() => handleRequestProfile('man')}
                        >
                            {isRequesting ? <Loader2 className="animate-spin" /> : <span>Demander profil Homme</span>}
                        </Button>
                        <Button 
                            className="h-14 rounded-2xl font-bold bg-woman-primary hover:bg-woman-primary/90 shadow-lg shadow-woman-primary/20"
                            disabled={isRequesting || !newName.trim() || !reason.trim()}
                            onClick={() => handleRequestProfile('woman')}
                        >
                            {isRequesting ? <Loader2 className="animate-spin" /> : <span>Demander profil Femme</span>}
                        </Button>
                    </div>
                </div>
            ) : (
                <Alert className="bg-orange-500/10 border-orange-500/20 rounded-2xl">
                    <ShieldAlert className="h-5 w-5 text-orange-500" />
                    <AlertTitle className="font-bold">Limite atteinte</AlertTitle>
                    <AlertDescription>
                        Vous avez atteint votre limite de {maxProfiles} profils. Augmentez votre limite pour continuer.
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>

        {maxProfiles < 10 && (
            <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-primary/20 via-background to-accent/20 shadow-2xl border border-white/10 overflow-hidden group">
                <CardHeader className="p-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-headline flex items-center gap-2 text-foreground">
                                <Star className="text-yellow-500 fill-yellow-500" /> Booster ma limite
                            </CardTitle>
                            <CardDescription className="text-foreground/70 font-medium">Débloquez jusqu'à 10 profils simultanés.</CardDescription>
                        </div>
                        <Badge className="bg-primary text-white px-4 py-1 text-lg font-black">{SUB_PROFILE_EXTEND_FEE_FCFA} FCFA</Badge>
                    </div>
                </CardHeader>
                <CardFooter className="p-8 pt-0">
                    <Button 
                        onClick={handleExtendLimit}
                        disabled={isExtending}
                        className="w-full h-16 rounded-[1.5rem] text-lg font-bold bg-primary text-white hover:bg-primary/90 shadow-xl group-hover:scale-[1.02] transition-transform"
                    >
                        {isExtending ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2" />}
                        Augmenter ma limite à 10 profils
                    </Button>
                </CardFooter>
            </Card>
        )}

        <section className="space-y-4">
            <h2 className="text-xl font-bold font-headline px-2 flex items-center gap-2">
                <UserCircle className="text-primary" /> Vos Identités
            </h2>
            <div className="grid grid-cols-1 gap-3">
                {myProfiles?.map(profile => (
                    <Card key={profile.id} className={cn(
                        "rounded-2xl border-none p-4 flex items-center justify-between shadow-md transition-all duration-300",
                        userProfile?.uid === profile.id ? "bg-primary/10 ring-2 ring-primary/20 scale-[1.02]" : "bg-card/40 hover:bg-card/60"
                    )}>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                <AvatarImage src={profile.photoUrl} className="object-cover" />
                                <AvatarFallback className="font-bold">{profile.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-sm">{profile.name}</p>
                                <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter h-4">
                                    {profile.role === 'man' ? 'Homme' : 'Femme'}
                                </Badge>
                            </div>
                        </div>
                        {userProfile?.uid === profile.id ? (
                            <Badge className="bg-green-500 text-white gap-1 px-3 py-1 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> ACTIF
                            </Badge>
                        ) : (
                            <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] h-8 px-4" onClick={() => switchProfile(profile.id)}>
                                UTILISER
                            </Button>
                        )}
                    </Card>
                ))}
            </div>
        </section>

        <Card className="border-none bg-destructive/5 shadow-xl rounded-3xl overflow-hidden mt-10">
          <CardHeader>
            <CardTitle className="text-destructive font-headline text-2xl">Session</CardTitle>
          </CardHeader>
          <CardFooter className="bg-destructive/10 pt-6">
            <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/20 font-bold h-12 rounded-2xl" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter (Tous les profils)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
