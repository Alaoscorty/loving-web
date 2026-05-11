
'use client';

import { useState, useEffect } from "react";
import { useAuth, useUser, useFirestore, useStorage } from "@/firebase";
import { signOutUser, updateUserProfile } from "@/lib/firebase-actions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Verified, CheckCircle2, Sun, Moon, Laptop, Sparkles, Palette, User, Shield, MessageCircle, Bell, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RequestBadgeDialog } from "@/components/request-badge-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const THEMES = [
    { id: 'loving', label: 'Loving Pink', primary: '326 60% 50%', secondary: '297 81% 67%' },
    { id: 'orange', label: 'Orange Sunset', primary: '33 100% 50%', secondary: '15 100% 50%' },
    { id: 'blue', label: 'Deep Blue', primary: '221 83% 53%', secondary: '199 89% 48%' },
    { id: 'green', label: 'Emerald Green', primary: '142 70% 45%', secondary: '160 84% 39%' },
];

export function SettingsView() {
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { userProfile } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [colorTheme, setColorTheme] = useState('loving');
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as any;
    if (savedTheme) setTheme(savedTheme);
    const savedColor = localStorage.getItem('color-theme') || 'loving';
    setColorTheme(savedColor);
    applyColorTheme(savedColor);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (newTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
    } else {
        root.classList.add(newTheme);
    }
  };

  const applyColorTheme = (themeId: string) => {
      const selected = THEMES.find(t => t.id === themeId);
      if (selected) {
          document.documentElement.style.setProperty('--primary', selected.primary);
          document.documentElement.style.setProperty('--accent', selected.secondary);
          setColorTheme(themeId);
          localStorage.setItem('color-theme', themeId);
      }
  }

  const handleTogglePrivacy = async (key: 'showOnlineStatus' | 'showReadReceipts', value: boolean) => {
    if (!userProfile || !firestore) return;
    setIsSavingPrivacy(true);
    try {
        const currentPrivacy = userProfile.privacySettings || { showOnlineStatus: true, showReadReceipts: true };
        await updateUserProfile({
            firestore,
            storage,
            userId: userProfile.uid,
            data: {
                privacySettings: {
                    ...currentPrivacy,
                    [key]: value
                }
            }
        });
        toast({ title: 'Paramètres mis à jour' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur lors de la mise à jour' });
    } finally {
        setIsSavingPrivacy(false);
    }
  }

  const handleSignOut = async () => {
    await signOutUser(auth);
    router.push('/login');
    toast({ title: 'Déconnexion', description: 'À bientôt sur Loving !' });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      <header>
          <h1 className="text-4xl font-bold font-headline tracking-tighter">Réglages</h1>
          <p className="text-muted-foreground">Gérez votre compte et personnalisez votre expérience.</p>
      </header>

      <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:w-[400px] rounded-2xl bg-muted/50 p-1">
              <TabsTrigger value="account" className="rounded-xl gap-2"><User className="w-4 h-4" /> Compte</TabsTrigger>
              <TabsTrigger value="design" className="rounded-xl gap-2"><Palette className="w-4 h-4" /> Design</TabsTrigger>
              <TabsTrigger value="privacy" className="rounded-xl gap-2"><Shield className="w-4 h-4" /> Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-card/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center gap-2">Profil & Badge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{userProfile?.name}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{userProfile?.role}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {userProfile?.isVerified ? (
                            <Alert className="bg-green-500/10 border-green-500/20">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <AlertTitle className="font-bold">Badge Bleu Actif</AlertTitle>
                                <AlertDescription className="text-xs">Valide jusqu'au {userProfile.verificationExpiresAt ? new Date(userProfile.verificationExpiresAt).toLocaleDateString() : '-'}.</AlertDescription>
                            </Alert>
                        ) : (
                            <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Verified className="text-blue-500 fill-blue-500" />
                                    <h4 className="font-bold">Devenir un membre certifié</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">Le badge bleu augmente votre visibilité de 300% et vous donne accès à des fonctionnalités exclusives.</p>
                                <Dialog open={isBadgeDialogOpen} onOpenChange={setIsBadgeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl font-bold">Obtenir mon badge (15 000 FCFA)</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md rounded-[2.5rem]"><RequestBadgeDialog onComplete={() => setIsBadgeDialogOpen(false)} /></DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-card/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-xl font-headline">Apparence & Couleurs</CardTitle>
                    <CardDescription>WhatsApp Style : Choisissez le style qui vous ressemble.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Mode d'affichage</Label>
                        <RadioGroup value={theme} onValueChange={(v: any) => handleThemeChange(v)} className="grid grid-cols-3 gap-4">
                            {['light', 'dark', 'system'].map((t) => (
                                <div key={t}>
                                    <RadioGroupItem value={t} id={`theme-${t}`} className="peer sr-only" />
                                    <Label htmlFor={`theme-${t}`} className="flex flex-col items-center p-4 rounded-2xl border-2 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                                        {t === 'light' ? <Sun /> : t === 'dark' ? <Moon /> : <Laptop />}
                                        <span className="capitalize text-xs mt-2 font-bold">{t}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Thème de couleur</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => applyColorTheme(t.id)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                        colorTheme === t.id ? "border-primary bg-primary/10 shadow-lg" : "border-muted hover:border-primary/30"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.primary})` }} />
                                    <span className="text-[10px] font-bold">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-card/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-xl font-headline">Confidentialité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-white/5">
                        <div className="flex gap-4">
                            <div className="p-2 bg-background rounded-xl text-primary"><MessageCircle /></div>
                            <div>
                                <p className="text-sm font-bold">Accusés de lecture</p>
                                <p className="text-[10px] text-muted-foreground">Si désactivé, vous ne verrez plus les coches bleues.</p>
                            </div>
                        </div>
                        <Switch 
                            checked={userProfile?.privacySettings?.showReadReceipts !== false} 
                            onCheckedChange={(v) => handleTogglePrivacy('showReadReceipts', v)}
                            disabled={isSavingPrivacy}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-white/5">
                        <div className="flex gap-4">
                            <div className="p-2 bg-background rounded-xl text-primary"><Shield /></div>
                            <div>
                                <p className="text-sm font-bold">Présence en ligne</p>
                                <p className="text-[10px] text-muted-foreground">Afficher votre statut aux autres membres.</p>
                            </div>
                        </div>
                        <Switch 
                            checked={userProfile?.privacySettings?.showOnlineStatus !== false} 
                            onCheckedChange={(v) => handleTogglePrivacy('showOnlineStatus', v)}
                            disabled={isSavingPrivacy}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-white/5 opacity-50">
                        <div className="flex gap-4">
                            <div className="p-2 bg-background rounded-xl text-primary"><Bell /></div>
                            <div>
                                <p className="text-sm font-bold">Notifications Push</p>
                                <p className="text-[10px] text-muted-foreground">Toujours actif sur cette version.</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="rounded-lg h-6">Auto</Badge>
                    </div>
                </CardContent>
                <CardFooter className="pt-6 border-t border-white/5">
                    <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 h-12 rounded-2xl font-bold" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                    </Button>
                </CardFooter>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
