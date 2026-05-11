
'use client';

import { useMemo, useState } from 'react';
import { collection, query, limit, where } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';
import type { UserProfile } from '@/types/user';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShieldCheck, User, MoreHorizontal, Eye, Trash2, Verified, MapPin, Calendar, Briefcase, MessageSquare, Loader2, Phone, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteUserProfile, toggleUserVerification, getOrCreateConversation } from '@/lib/firebase-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { userProfile, user: authUser, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState<string | null>(null);

  const usersQuery = useMemo(() => {
    if (!firestore || userProfile?.role !== 'admin') return null;
    return query(
        collection(firestore, 'users'), 
        where('role', 'in', ['man', 'woman']),
        limit(100)
    );
  }, [firestore, userProfile]);

  const { data: users, loading: dataLoading } = useCollection<UserProfile>(usersQuery);

  const sortedUsers = useMemo(() => {
      if (!users) return [];
      return [...users].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
      });
  }, [users]);

  const handleDelete = async () => {
    if (!userToDelete || !firestore) return;
    setIsDeleting(true);
    try {
        await deleteUserProfile(firestore, userToDelete);
        toast({ title: 'Utilisateur supprimé' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur' });
    } finally {
        setIsDeleting(false);
        setUserToDelete(null);
    }
  };

  const handleToggleCertif = async (user: UserProfile) => {
      if (!firestore) return;
      try {
          await toggleUserVerification(firestore, user.uid, !user.isVerified);
          toast({ title: 'Statut mis à jour' });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur' });
      }
  }

  const handleDirectChat = async (targetUid: string) => {
      if (!firestore || !authUser) return;
      setIsOpeningChat(targetUid);
      try {
          await getOrCreateConversation(firestore, authUser.uid, targetUid);
          toast({ title: 'Discussion ouverte' });
          router.push('/dashboard/messages');
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur' });
      } finally {
          setIsOpeningChat(null);
      }
  }

  if (authLoading) return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  if (userProfile?.role !== 'admin') return <div className="p-8">Accès restreint.</div>;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center gap-2">
            <User className="w-8 h-8" /> Gestion des Membres
        </h1>
        <p className="text-muted-foreground mt-1">{sortedUsers.length} membres actifs listés.</p>
      </header>

      <Card className="rounded-2xl border-none shadow-xl overflow-hidden bg-card/40 backdrop-blur-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ))
              ) : sortedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucun membre trouvé.</TableCell></TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow key={user.uid} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.photoUrl} className="object-cover" />
                          <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm flex items-center gap-1">
                            {user?.name}
                            {user?.isVerified && <ShieldCheck className="w-3 h-3 text-blue-500 fill-blue-500" />}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{user?.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                          "capitalize text-[10px] font-bold",
                          user?.role === 'woman' ? "text-woman-primary border-woman-primary/20" : "text-man-primary border-man-primary/20"
                      )}>
                        {user?.role === 'woman' ? 'Femme' : 'Homme'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {user?.whatsappNumber ? (
                            <div className="flex items-center gap-1.5 text-green-500 font-mono text-[10px] font-bold">
                                <Phone className="w-3 h-3" /> {user.whatsappNumber}
                            </div>
                        ) : (
                            <span className="text-[10px] text-muted-foreground italic">Non renseigné</span>
                        )}
                    </TableCell>
                    <TableCell>
                        {user?.isVerified ? (
                            <Badge className="bg-blue-500 text-white text-[9px]">CERTIFIÉ</Badge>
                        ) : (
                            <Badge variant="secondary" className="text-[9px]">STANDARD</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-primary border-primary/20"
                                onClick={() => handleDirectChat(user.uid)}
                                disabled={isOpeningChat === user.uid}
                            >
                                {isOpeningChat === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl shadow-2xl">
                                    <DropdownMenuItem onClick={() => setSelectedUser(user)} className="cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" /> Voir les détails
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleCertif(user)} className="cursor-pointer">
                                        <Verified className={cn("mr-2 h-4 w-4", user?.isVerified ? "text-muted-foreground" : "text-blue-500")} /> 
                                        {user?.isVerified ? 'Révoquer certification' : 'Activer certification'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => setUserToDelete(user.uid)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer le compte
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(v) => !v && setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible et effacera toutes les données du profil de manière définitive.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl" disabled={isDeleting}>
                {isDeleting ? "Suppression..." : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedUser} onOpenChange={(v) => !v && setSelectedUser(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] overflow-hidden p-6 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Détails du profil</DialogTitle>
            </DialogHeader>
            {selectedUser && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[80vh] overflow-y-auto scrollbar-hide px-1">
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-3xl">
                        <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-lg">
                            <AvatarImage src={selectedUser.photoUrl} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold bg-muted">{selectedUser.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold font-headline leading-tight">{selectedUser.name}</h2>
                            <p className="text-xs text-muted-foreground font-mono">{selectedUser.email}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className={cn(
                                    "text-[8px] font-bold uppercase",
                                    selectedUser.role === 'woman' ? "text-woman-primary border-woman-primary/20" : "text-man-primary border-man-primary/20"
                                )}>
                                    {selectedUser.role === 'woman' ? 'Femme' : 'Homme'}
                                </Badge>
                                {selectedUser.isVerified && <Badge className="bg-blue-500 text-white text-[8px] font-bold">CERTIFIÉ</Badge>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-background border rounded-2xl space-y-1 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary" /> Ville</p>
                            <p className="text-sm font-bold truncate">{selectedUser.city || '-'}</p>
                        </div>
                        <div className="p-4 bg-background border rounded-2xl space-y-1 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Heart className="w-3 h-3 text-primary" /> Statut</p>
                            <p className="text-sm font-bold truncate">{selectedUser.maritalStatus || '-'}</p>
                        </div>
                        <div className="p-4 bg-background border rounded-2xl space-y-1 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3 text-green-500" /> WhatsApp</p>
                            <p className="text-sm font-bold truncate text-green-600 font-mono">{selectedUser.whatsappNumber || '-'}</p>
                        </div>
                        <div className="p-4 bg-background border rounded-2xl space-y-1 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3 text-primary" /> Inscrit le</p>
                            <p className="text-sm font-bold truncate">{selectedUser.createdAt ? format(new Date(selectedUser.createdAt), 'dd/MM/yy', { locale: fr }) : '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1">Biographie</p>
                        <div className="text-sm italic p-4 bg-primary/5 rounded-3xl leading-relaxed border border-primary/10">
                            "{selectedUser.bio || "Aucune biographie rédigée."}"
                        </div>
                    </div>

                    <Button 
                        className="w-full h-14 rounded-2xl font-bold gap-2 text-lg shadow-xl shadow-primary/20" 
                        onClick={() => handleDirectChat(selectedUser.uid)}
                        disabled={isOpeningChat === selectedUser.uid}
                    >
                        {isOpeningChat === selectedUser.uid ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                        Discuter avec le membre
                    </Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
