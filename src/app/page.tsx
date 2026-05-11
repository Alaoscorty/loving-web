
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Heart, ShieldCheck, Sparkles, Star, Users, ArrowRight, Facebook, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';

const TikTokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.14 2.76-.08 5.51-.14 8.26-.14 2.16-1.16 4.35-2.9 5.6-1.74 1.25-4.18 1.71-6.19 1.11-2.01-.6-3.83-2.22-4.43-4.23-.6-2.01-.14-4.45 1.11-6.19 1.25-1.74 3.44-2.76 5.6-2.9h.14v4.03c-1.44.17-2.89.6-4.13 1.47 1.25.87 2.69 1.3 4.13 1.47v-8.26c-1.31.02-2.61.01-3.91.02V.02z" />
  </svg>
);

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-couple');
  const trustAvatars = PlaceHolderImages.filter((img) => img.id.startsWith('trust-avatar-'));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative min-h-[90vh] md:min-h-[95vh] w-full flex items-center justify-center overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover object-center scale-105 animate-in fade-in zoom-in duration-1000 brightness-[0.6]"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-background" />
        
        <nav className="absolute top-0 left-0 right-0 p-4 md:p-8 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Icons.logo className="h-8 w-8 md:h-10 md:w-10 text-primary drop-shadow-lg" />
              <span className="text-2xl md:text-3xl font-bold font-headline text-white tracking-tight">Loving</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-6">
              <Button variant="ghost" asChild className="hidden sm:inline-flex font-bold text-white hover:bg-white/10">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild className="shadow-2xl shadow-primary/30 h-10 md:h-12 px-4 md:px-8 rounded-full font-bold bg-primary hover:bg-primary/90 text-white border-none text-xs md:text-sm">
                <Link href="/register">S'inscrire</Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/20 border border-primary/30 text-primary animate-in slide-in-from-top-4 duration-700 backdrop-blur-md">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm font-bold uppercase tracking-tighter">La plateforme n°1 en Afrique</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold font-headline text-white tracking-tighter leading-[0.9] drop-shadow-2xl px-2">
              L'élégance des <span className="text-primary italic">rencontres</span>.
            </h1>
            
            <p className="text-sm md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg px-4">
              Le club exclusif où les hommes invitent avec distinction et les femmes choisissent en toute sérénité.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4 md:pt-8 px-6 pb-12">
              <Button size="lg" asChild className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-transform duration-300 font-bold bg-primary text-white border-none">
                <Link href="/login">Créer mon profil</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl rounded-full backdrop-blur-xl border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 font-bold">
                <Link href="/login">Explorer le club</Link>
              </Button>
            </div>

            {/* Barre de Confiance Intégrée */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-10 duration-1000">
                <div className="flex -space-x-4 items-center">
                    {trustAvatars.slice(0, 5).map((avatar, i) => (
                        <div key={i} className="relative w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-card shadow-xl overflow-hidden" style={{ zIndex: 10 + i }}>
                            <Image src={avatar.imageUrl} alt="Member" fill className="object-cover" />
                        </div>
                    ))}
                </div>
                <div className="text-left space-y-1">
                    <div className="flex gap-0.5 mb-1 justify-center md:justify-start">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                    </div>
                    <p className="text-white font-black text-sm md:text-lg tracking-tighter uppercase">+10 000 Membres Certifiés</p>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-20 md:py-32 container mx-auto px-4 bg-muted/5 rounded-3xl md:rounded-[4rem]">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4 md:space-y-6 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-[10px] font-bold uppercase tracking-widest">Excellence</div>
          <h2 className="text-3xl md:text-6xl font-bold font-headline tracking-tighter">Pourquoi choisir <span className="text-primary italic">Loving</span> ?</h2>
          <p className="text-muted-foreground text-sm md:text-xl leading-relaxed">Nous avons redéfini les standards des rencontres pour privilégier la qualité et le respect mutuel.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-2 md:px-4">
          <Card className="border-none bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-500 rounded-2xl md:rounded-[3rem] p-4 shadow-xl md:shadow-2xl group">
            <CardContent className="pt-8 md:pt-12 text-center space-y-6 md:space-y-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-primary text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto shadow-xl group-hover:rotate-6 transition-transform">
                <ShieldCheck className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              <div className="space-y-2 md:space-y-4">
                <h3 className="text-xl md:text-2xl font-bold font-headline">Sécurité Absolue</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">Vérification par selfie IA, scan de QR code et géolocalisation pour garantir des rencontres 100% authentiques.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-500 rounded-2xl md:rounded-[3rem] p-4 shadow-xl md:shadow-2xl group">
            <CardContent className="pt-8 md:pt-12 text-center space-y-6 md:space-y-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-accent text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto shadow-xl group-hover:-rotate-6 transition-transform">
                <Heart className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              <div className="space-y-2 md:space-y-4">
                <h3 className="text-xl md:text-2xl font-bold font-headline">Concept Élite</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">Les hommes proposent des rendez-vous concrets et raffinés. Les femmes sont au cœur du processus de décision.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-500 rounded-2xl md:rounded-[3rem] p-4 shadow-xl md:shadow-2xl group">
            <CardContent className="pt-8 md:pt-12 text-center space-y-6 md:space-y-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-primary text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto shadow-xl group-hover:rotate-6 transition-transform">
                <Star className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              <div className="space-y-2 md:space-y-4">
                <h3 className="text-xl md:text-2xl font-bold font-headline">Fidélité Récompensée</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">Gagnez des points XP à chaque interaction, monétisez votre présence et débloquez des coffres mystères exclusifs.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION SUIVEZ-NOUS */}
      <section className="py-20 md:py-32 container mx-auto px-4">
        <div className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-[4rem] p-12 md:p-24 flex flex-col items-center text-center space-y-10 shadow-2xl">
            <div className="space-y-4">
                <h2 className="text-3xl md:text-6xl font-black font-headline tracking-tighter leading-none">Rejoignez le <span className="text-primary italic">Club Social</span></h2>
                <p className="text-muted-foreground text-sm md:text-xl max-w-xl mx-auto">Restez connecté avec l'univers Loving et découvrez les coulisses des rencontres les plus élégantes d'Afrique.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                <a href="https://facebook.com/lovingapp" target="_blank" className="group flex flex-col items-center gap-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1877F2]/10 rounded-[1.5rem] flex items-center justify-center text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-all shadow-xl group-hover:scale-110">
                        <Facebook className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Facebook</span>
                </a>
                <a href="https://tiktok.com/@lovingapp" target="_blank" className="group flex flex-col items-center gap-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-black/10 rounded-[1.5rem] flex items-center justify-center text-black dark:text-white group-hover:bg-black group-hover:text-white transition-all shadow-xl group-hover:scale-110">
                        <TikTokIcon className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">TikTok</span>
                </a>
                <a href="https://instagram.com/lovingapp" target="_blank" className="group flex flex-col items-center gap-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-500/10 rounded-[1.5rem] flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-xl group-hover:scale-110">
                        <Instagram className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Instagram</span>
                </a>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-br from-primary via-primary/90 to-accent rounded-3xl md:rounded-[5rem] p-8 md:p-32 space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden group text-center border-none">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative z-10 space-y-4 md:space-y-8">
                <h2 className="text-3xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">Prêt à rejoindre l'exception ?</h2>
                <p className="text-white/80 text-lg md:text-3xl max-w-3xl mx-auto font-medium leading-relaxed">Le club privé où chaque connexion a une valeur réelle.</p>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto h-16 md:h-20 px-10 md:px-16 text-lg md:text-2xl rounded-full shadow-2xl bg-white text-primary hover:bg-white/90 hover:scale-105 active:scale-95 transition-all border-none font-bold">
                  <Link href="/login" className="flex items-center gap-3">Commencer <ArrowRight className="w-5 h-5 md:w-6 md:h-6" /></Link>
                </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 md:py-24 border-t mt-auto bg-muted/5">
        <div className="container mx-auto px-4 text-center space-y-8 md:space-y-12">
          <div className="flex items-center justify-center gap-3">
            <Icons.logo className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            <span className="text-3xl md:text-4xl font-bold font-headline tracking-tighter">Loving</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-16 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">Conditions</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link>
            <Link href="/about" className="hover:text-primary transition-colors">L'Histoire</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Support</Link>
          </div>
          <div className="space-y-4 max-w-sm mx-auto">
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} Loving. Tous droits réservés.
            </p>
            <p className="text-[8px] md:text-[9px] text-muted-foreground/50 uppercase tracking-[0.4em] leading-relaxed">
              Développé avec passion pour l'élégance africaine.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
