
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
   Bell,
   BookUser,
   CalendarClock,
   Gamepad2,
   Heart,
   Home,
   MessageSquare,
   Settings,
   ShieldCheck,
   Users,
   Wallet,
   Sparkles,
   BarChart3,
   Verified,
   Gift,
   Banknote,
   ShieldAlert,
   Info,
   Power,
   ChevronUp,
   PlusCircle,
   Shield,
   UserPlus,
   AlertCircle,
   Facebook,
   Instagram
} from 'lucide-react';

import { Icons } from '@/components/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUser, useFirestore, useAuth, useCollection } from '@/firebase';
import { Badge } from './ui/badge';
import { collection, query, where } from 'firebase/firestore';
import { Button } from './ui/button';
import { signOutUser } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const TikTokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.14 2.76-.08 5.51-.14 8.26-.14 2.16-1.16 4.35-2.9 5.6-1.74 1.25-4.18 1.71-6.19 1.11-2.01-.6-3.83-2.22-4.43-4.23-.6-2.01-.14-4.45 1.11-6.19 1.25-1.74 3.44-2.76 5.6-2.9h.14v4.03c-1.44.17-2.89.6-4.13 1.47 1.25.87 2.69 1.3 4.13 1.47v-8.26c-1.31.02-2.61.01-3.91.02V.02z" />
  </svg>
);

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { userProfile, loading, switchProfile, user } = useUser();
  const { toast } = useToast();
  const userRole = userProfile?.role;
  
  const isActive = (path: string) => pathname === path;

  // 1. Compteur de notifications non lues
  const unreadNotificationsQuery = useMemo(() => {
    if (!firestore || !userProfile?.uid) return null;
    return query(
      collection(firestore, 'notifications'),
      where('recipientUid', '==', userProfile.uid),
      where('isRead', '==', false)
    );
  }, [firestore, userProfile?.uid]);

  const { data: unreadNotifications } = useCollection<any>(unreadNotificationsQuery);
  const unreadCount = unreadNotifications?.length || 0;

  // 2. Compteur de messages non lus
  const unreadMessagesQuery = useMemo(() => {
    if (!firestore || !userProfile?.uid) return null;
    return query(
      collection(firestore, 'conversations'),
      where('participants', 'array-contains', userProfile.uid)
    );
  }, [firestore, userProfile?.uid]);

  const { data: conversationsForCount } = useCollection<any>(unreadMessagesQuery);
  const totalUnreadMessages = useMemo(() => {
    if (!conversationsForCount || !userProfile) return 0;
    return conversationsForCount.reduce((acc: number, convo: any) => {
        return acc + (convo.unreadCount?.[userProfile.uid] || 0);
    }, 0);
  }, [conversationsForCount, userProfile]);

  // 3. Compteur de Rendez-vous en attente
  const rendezvousQuery = useMemo(() => {
    if (!firestore || !userProfile?.uid || userRole === 'admin') return null;
    const field = userRole === 'woman' ? 'womanUid' : 'manUid';
    return query(
      collection(firestore, 'rendezvous'),
      where(field, '==', userProfile.uid),
      where('status', '==', 'pending')
    );
  }, [firestore, userProfile?.uid, userRole]);

  const { data: pendingRdv } = useCollection<any>(rendezvousQuery);
  const pendingRdvCount = pendingRdv?.length || 0;

  // --- ADMIN QUERIES ---
  const profileReqQuery = useMemo(() => {
    if (!firestore || userRole !== 'admin') return null;
    return query(collection(firestore, 'profileRequests'), where('status', '==', 'pending'));
  }, [firestore, userRole]);

  const { data: profileReqs } = useCollection<any>(profileReqQuery);

  const commonLinks = [
    { href: '/dashboard', label: 'Accueil', icon: Home, badge: (unreadCount + totalUnreadMessages) > 0 ? (unreadCount + totalUnreadMessages) : undefined },
    { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, badge: totalUnreadMessages },
    { href: '/dashboard/wallet', label: 'Portefeuille', icon: Wallet },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { href: '/dashboard/referral', label: 'Parrainage', icon: Gift },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
  ];

  const roleLinks = useMemo(() => {
    if (loading) return [];
    if (userRole === 'woman') return [
        { href: '/dashboard/woman/guide', label: 'Fonctionnement', icon: Info },
        { href: '/dashboard/woman/stats', label: 'Statistiques', icon: BarChart3 },
        { href: '/dashboard/woman/rendezvous', label: 'Rendez-vous', icon: CalendarClock, badge: pendingRdvCount },
        { href: '/dashboard/woman/profile', label: 'Mon Profil', icon: BookUser },
        { href: '/dashboard/woman/games', label: 'Jeux', icon: Gamepad2 },
    ];
    if (userRole === 'man') return [
        { href: '/dashboard/man/guide', label: 'Fonctionnement', icon: Info },
        { href: '/dashboard/man/stats', label: 'Statistiques', icon: BarChart3 },
        { href: '/dashboard/man/discover', label: 'Swipe & Match', icon: Sparkles },
        { href: '/dashboard/man/browse', label: 'Découvrir', icon: Users },
        { href: '/dashboard/man/rendezvous', label: 'Rendez-vous', icon: CalendarClock, badge: pendingRdvCount },
        { href: '/dashboard/man/my-games', label: 'Mes Jeux', icon: Gamepad2 },
    ];
    if (userRole === 'admin') return [
        { href: '/dashboard/admin/users', label: 'Membres', icon: Users },
        { href: '/dashboard/admin/profile-requests', label: 'Profils', icon: UserPlus, badge: profileReqs?.length },
        { href: '/dashboard/admin/stats', label: 'Stats Globales', icon: BarChart3 },
    ];
    return [];
  }, [userRole, loading, pendingRdvCount, profileReqs?.length]);

  const handleSignOut = async () => {
    await signOutUser(auth);
    router.push('/login');
    toast({ title: 'Déconnexion' });
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="flex items-center justify-between p-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Icons.logo className="w-8 h-8 text-primary" />
          <span className="font-bold text-lg font-headline group-data-[collapsible=icon]:hidden">Loving</span>
        </Link>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {commonLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton asChild isActive={isActive(link.href)} tooltip={link.label}>
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold shadow-lg animate-in zoom-in">
                      {link.badge > 99 ? '99+' : link.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <Separator />
        <SidebarMenu>
          {roleLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton asChild isActive={isActive(link.href)} tooltip={link.label}>
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (typeof link.badge === 'number' ? link.badge > 0 : !!link.badge) && (
                    <Badge variant="secondary" className="ml-auto h-5 min-w-5 flex items-center justify-center p-1 text-[10px] font-bold shadow-sm animate-in zoom-in">
                        {link.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <Separator className="my-4" />
        
        {/* SECTION FOLLOW US */}
        <div className="px-4 py-4 space-y-4 group-data-[collapsible=icon]:hidden animate-in fade-in duration-1000">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-2">Suivez-nous</h4>
            <div className="flex items-center gap-2 px-1">
                <a href="https://facebook.com/lovingapp" target="_blank" className="p-2 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all shadow-sm">
                    <Facebook className="w-5 h-5" />
                </a>
                <a href="https://tiktok.com/@lovingapp" target="_blank" className="p-2 rounded-xl bg-black/5 text-black hover:bg-black hover:text-white transition-all shadow-sm dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black">
                    <TikTokIcon className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/lovingapp" target="_blank" className="p-2 rounded-xl bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all shadow-sm">
                    <Instagram className="w-5 h-5" />
                </a>
            </div>
            <p className="text-[9px] text-muted-foreground italic px-2">Rejoignez le club Loving sur les réseaux !</p>
        </div>
      </SidebarContent>
      <Separator />
      <SidebarFooter className='p-2'>
        {userProfile && (
            <div className="flex items-center gap-1 w-full p-1 rounded-xl bg-sidebar-accent/50 group-data-[collapsible=icon]:bg-transparent">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 flex-1 min-w-0 p-1.5 rounded-lg hover:bg-muted transition-colors outline-none text-left">
                            <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/20">
                              <AvatarImage src={userProfile.photoUrl} className="object-cover" />
                              <AvatarFallback className="font-bold text-[10px]">{userProfile.name?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                                <span className="text-xs font-bold truncate flex items-center gap-1">
                                    {userProfile.name}
                                    {userProfile.isVerified && <Verified className="w-3 h-3 text-blue-500 fill-blue-500 shrink-0" />}
                                </span>
                                <span className="text-[9px] text-muted-foreground capitalize truncate">{userProfile.role}</span>
                            </div>
                            <ChevronUp className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-[240px] rounded-2xl p-2 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-2 py-1">Vos Comptes</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-xl gap-3 p-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleSignOut}>
                            <Power className="h-5 w-5" />
                            <span className="text-xs font-bold">Déconnexion</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
