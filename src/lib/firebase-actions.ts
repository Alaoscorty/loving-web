
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, Firestore, setDoc, updateDoc, collection, addDoc, increment, getDoc, query, where, getDocs, arrayUnion, arrayRemove, deleteDoc, orderBy, limit, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, FirebaseStorage } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile } from '@/types/user';
import type { Notification } from '@/types/notification';
import type { Review } from '@/types/review';
import type { Message } from '@/types/message';

export const POINTS_CONVERSION_RATE = 1;
export const MIN_WITHDRAWAL_POINTS = 2000;
export const WITHDRAWAL_FEE_PERCENTAGE = 0.20;

export const RENDEZVOUS_FEE_FCFA = 500;
export const WHATSAPP_UNLOCK_FEE_FCFA = 500;
export const BADGE_PREMIUM_FEE_FCFA = 15000;
export const SUB_PROFILE_EXTEND_FEE_FCFA = 7000;
export const CONTACT_PACK_FEE_FCFA = 5000;
export const WHEEL_SPIN_COST = 100;

export const RENDEZVOUS_FEE_XP = 30;
export const WHATSAPP_UNLOCK_FEE_XP = 30;
export const CONTACT_PACK_FEE_XP = 500; 
export const BOOST_PROFILE_XP = 500;
export const BIRTHDAY_BONUS_XP = 500;
export const WOMAN_RDV_REWARD_XP = 1800;
export const SOCIAL_FOLLOW_REWARD_XP = 50;

export async function updateUserPresence(firestore: Firestore, userId: string) {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        lastActive: new Date().toISOString()
    });
}

export async function claimSocialReward({ firestore, userId, platform }: { firestore: Firestore, userId: string, platform: string }) {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const data = userSnap.data() as UserProfile;
    if (data.socialFollows?.includes(platform)) return; // Déjà réclamé

    await updateDoc(userRef, {
        points: increment(SOCIAL_FOLLOW_REWARD_XP),
        socialFollows: arrayUnion(platform),
        lastActive: new Date().toISOString()
    });

    await createNotification({
        firestore,
        recipientUid: userId,
        title: "Cadeau de Bienvenue ! 🎁",
        message: `Vous avez reçu +${SOCIAL_FOLLOW_REWARD_XP} XP pour nous avoir suivi sur ${platform}.`,
        type: 'selfie_validated'
    });
}

export async function unlockWhatsAppNumber({ firestore, userId, targetUid, paymentMethod }: { firestore: Firestore, userId: string, targetUid: string, paymentMethod: 'xp' | 'cash' }) {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    if (paymentMethod === 'xp') {
        if ((userData.points || 0) < WHATSAPP_UNLOCK_FEE_XP) {
            throw new Error(`Points XP insuffisants (${WHATSAPP_UNLOCK_FEE_XP} XP requis).`);
        }
        await updateDoc(userRef, { points: increment(-WHATSAPP_UNLOCK_FEE_XP) });
    }

    await updateDoc(userRef, {
        unlockedNumbers: arrayUnion(targetUid),
        lastActive: new Date().toISOString()
    });
}

export async function editMessage(firestore: Firestore, conversationId: string, messageId: string, newText: string) {
    const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
        text: newText,
        editedAt: new Date().toISOString()
    });
}

export async function deleteMessageForEveryone(firestore: Firestore, conversationId: string, messageId: string) {
    const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
        isDeletedForEveryone: true,
        text: '',
        imageUrl: null,
        type: 'text'
    });
}

export async function deleteMessageForMe(firestore: Firestore, conversationId: string, messageId: string, userId: string) {
    const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
        deletedForUsers: arrayUnion(userId)
    });
}

export async function updateConversationSettings(firestore: Firestore, conversationId: string, settings: { autoDeleteDays: number, wallpaper?: string }) {
    const convoRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(convoRef, {
        settings: settings
    });
}

export async function submitReview({
  firestore,
  review
}: {
  firestore: Firestore;
  review: Omit<Review, 'id' | 'status'>;
}) {
  const reviewDoc = await addDoc(collection(firestore, 'reviews'), {
    ...review,
    status: 'pending',
  });

  const targetUserRef = doc(firestore, 'users', review.targetUid);
  const targetSnap = await getDoc(targetUserRef);
  if (targetSnap.exists()) {
    const data = targetSnap.data() as UserProfile;
    const currentRating = data.rating || 5;
    const currentCount = data.reviewCount || 0;
    const newCount = currentCount + 1;
    const newRating = (currentRating * currentCount + review.stars) / newCount;
    
    await updateDoc(targetUserRef, {
      rating: newRating,
      reviewCount: newCount
    });
  }

  if (review.isComplaint || review.stars <= 2) {
      await createNotification({
          firestore,
          recipientUid: 'SYSTEM_ADMIN',
          title: "Nouvelle plainte reçue 🚨",
          message: `Une plainte a été déposée par ${review.fromName} contre ${review.targetName}.`,
          type: 'rendezvous_declined',
          link: '/dashboard/admin/complaints'
      });
  }

  return reviewDoc.id;
}

export async function getOrCreateAdminConversation(firestore: Firestore, userUid: string) {
    const adminQuery = query(collection(firestore, 'users'), where('role', '==', 'admin'), limit(1));
    const adminSnap = await getDocs(adminQuery);
    
    if (adminSnap.empty) throw new Error("Aucun administrateur disponible.");
    const adminUid = adminSnap.docs[0].id;
    return getOrCreateConversation(firestore, userUid, adminUid);
}

export async function getOrCreateConversation(firestore: Firestore, u1Id: string, u2Id: string) {
  const participants = [u1Id, u2Id].sort();
  const q = query(collection(firestore, 'conversations'), where('participants', '==', participants));
  const snap = await getDocs(q);
  
  if (!snap.empty) return snap.docs[0].id;

  const [p1Doc, p2Doc] = await Promise.all([
    getDoc(doc(firestore, 'users', u1Id)),
    getDoc(doc(firestore, 'users', u2Id))
  ]);

  const p1 = p1Doc.data() as UserProfile;
  const p2 = p2Doc.data() as UserProfile;

  const ownerParticipants = Array.from(new Set([p1?.ownerUid, p2?.ownerUid].filter(Boolean)));

  const newConvo = { 
    participants, 
    ownerParticipants,
    participantProfiles: {
        [u1Id]: { name: p1?.name || 'Utilisateur', photoUrl: p1?.photoUrl || '', role: p1?.role, isVerified: p1?.isVerified },
        [u2Id]: { name: p2?.name || 'Utilisateur', photoUrl: p2?.photoUrl || '', role: p2?.role, isVerified: p2?.isVerified }
    },
    updatedAt: new Date().toISOString(), 
    lastMessage: null,
    unreadCount: {
        [u1Id]: 0,
        [u2Id]: 0
    },
    typing: {
        [u1Id]: false,
        [u2Id]: false
    },
    settings: {
        autoDeleteDays: 240 
    }
  };

  const ref = await addDoc(collection(firestore, 'conversations'), newConvo);
  return ref.id;
}

export async function sendMessage({ firestore, storage, conversationId, senderUid, senderOwnerUid, text, photoFile, isViewOnce, type = 'text', imageUrl }: any) {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  if (!conversationSnap.exists()) return;
  
  const convoData = conversationSnap.data();
  const recipientUid = convoData.participants.find((p: string) => p !== senderUid);
  const senderProfile = convoData.participantProfiles?.[senderUid] || { name: 'Membre Loving' };

  let finalImageUrl = imageUrl;
  if (photoFile && storage) {
      const fileRef = ref(storage, `chats/${conversationId}/${uuidv4()}.jpg`);
      await uploadBytes(fileRef, photoFile);
      finalImageUrl = await getDownloadURL(fileRef);
  }

  const msgData = { 
    senderUid, 
    senderOwnerUid,
    text: text || '', 
    imageUrl: finalImageUrl || null,
    type: finalImageUrl ? (type === 'gif' ? 'gif' : 'image') : 'text',
    isViewOnce: !!isViewOnce,
    viewedBy: [],
    timestamp: new Date().toISOString(), 
    isRead: false,
    deletedForUsers: []
  };

  const messagesRef = collection(conversationRef, 'messages');
  const newMessageDoc = await addDoc(messagesRef, msgData);
  
  const updates: any = { 
    lastMessage: { ...msgData, id: newMessageDoc.id }, 
    updatedAt: new Date().toISOString(),
    [`typing.${senderUid}`]: false 
  };

  if (recipientUid) {
      updates[`unreadCount.${recipientUid}`] = increment(1);
      
      await createNotification({
          firestore,
          recipientUid,
          title: `Nouveau message de ${senderProfile.name}`,
          message: finalImageUrl ? (type === 'gif' ? "🎬 GIF" : "📷 Photo") : (text || "Nouveau message"),
          type: 'message_new',
          link: '/dashboard/messages'
      });
  }

  await updateDoc(conversationRef, updates);
}

export async function markViewOnceAsSeen(firestore: Firestore, conversationId: string, messageId: string, userId: string) {
    const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
        viewedBy: arrayUnion(userId)
    });
}

export async function updateTypingStatus(firestore: Firestore, conversationId: string, userId: string, isTyping: boolean) {
    const conversationRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(conversationRef, {
        [`typing.${userId}`]: isTyping
    });
}

export async function markConversationAsRead(firestore: Firestore, conversationId: string, profileId: string) {
    try {
        const conversationRef = doc(firestore, 'conversations', conversationId);
        await updateDoc(conversationRef, { [`unreadCount.${profileId}`]: 0 });

        const messagesQuery = query(
            collection(conversationRef, 'messages'),
            where('isRead', '==', false)
        );
        const snap = await getDocs(messagesQuery);
        if (!snap.empty) {
            const batch = writeBatch(firestore);
            snap.docs.forEach(d => {
                const data = d.data();
                if (data.senderUid !== profileId) {
                    batch.update(d.ref, { isRead: true });
                }
            });
            await batch.commit();
        }
    } catch (e) {
        console.error("Erreur lors du marquage comme lu:", e);
    }
}

export async function signUpAndCreateProfile({
  auth,
  firestore,
  storage,
  role,
  data,
  photoFile,
  referredByCode,
}: {
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  role: 'woman' | 'man' | 'admin';
  data: any;
  photoFile?: File | null;
  referredByCode?: string | null;
}) {
  const { email, password, ...profileData } = data;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let photoUrl: string = '';
  if (photoFile) {
    const filePath = `profile-photos/${user.uid}/main-${uuidv4()}.jpg`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, photoFile);
    photoUrl = await getDownloadURL(fileRef);
  }

  const userProfile: UserProfile = {
    ...profileData,
    uid: user.uid,
    ownerUid: user.uid,
    isMaster: true,
    email: user.email!,
    role: role,
    photoUrl: photoUrl,
    secondaryPhotos: [],
    createdAt: new Date().toISOString(),
    points: 0,
    rating: 5,
    reviewCount: 0,
    likesCount: 0,
    level: 'Bronze',
    completedQuests: [],
    streak: 1,
    lastLogin: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    swipesRemaining: 20,
    lastSwipeDate: new Date().toISOString(),
    isVerified: false,
    verificationStatus: 'none',
    referralCode: user.uid.slice(0, 8).toUpperCase(),
    referredBy: referredByCode || null,
    maxSubProfiles: 3,
    unlockedContacts: [],
    unlockedNumbers: [],
    socialFollows: [],
    privacySettings: {
        showOnlineStatus: true,
        showReadReceipts: true
    }
  };
  
  await setDoc(doc(firestore, 'users', user.uid), userProfile);
  return userProfile;
}

export async function submitProfileRequest({ firestore, ownerUid, role, name, reason }: any) {
    await addDoc(collection(firestore, 'profileRequests'), {
        ownerUid,
        role,
        name,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
}

export async function createSubProfile({ firestore, ownerUid, role, name, email }: any) {
    const profileId = uuidv4();
    const newProfile: UserProfile = {
        uid: profileId,
        ownerUid: ownerUid,
        isMaster: false,
        email: email,
        name: name,
        role: role,
        photoUrl: '',
        secondaryPhotos: [],
        createdAt: new Date().toISOString(),
        points: 0,
        rating: 5,
        reviewCount: 0,
        likesCount: 0,
        level: 'Bronze',
        completedQuests: [],
        streak: 1,
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        swipesRemaining: 20,
        lastSwipeDate: new Date().toISOString(),
        isVerified: false,
        verificationStatus: 'none',
        referralCode: profileId.slice(0, 8).toUpperCase(),
        referredBy: null,
        unlockedContacts: [],
        unlockedNumbers: [],
        socialFollows: [],
        privacySettings: {
            showOnlineStatus: true,
            showReadReceipts: true
        }
    };
    await setDoc(doc(firestore, 'users', profileId), newProfile);
    return profileId;
}

export async function handleUserStreakAndSwipes(firestore: Firestore, userId: string) {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return;

  const data = userDoc.data() as UserProfile;
  const now = new Date();
  const updates: any = { lastLogin: now.toISOString(), lastActive: now.toISOString() };

  if (data.isVerified && data.verificationExpiresAt) {
      const expiresAt = new Date(data.verificationExpiresAt);
      if (expiresAt < now) {
          updates.isVerified = false;
          updates.verificationStatus = 'none';
      } 
  }

  const lastLogin = data.lastLogin ? new Date(data.lastLogin) : null;
  if (lastLogin) {
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) updates.streak = (data.streak || 0) + 1;
    else if (diffDays > 1) updates.streak = 1;
  } else updates.streak = 1;

  const lastSwipeDate = data.lastSwipeDate ? new Date(data.lastSwipeDate) : null;
  if (!lastSwipeDate || now.toDateString() !== lastSwipeDate.toDateString()) {
      updates.swipesRemaining = 20;
      updates.lastSwipeDate = now.toISOString();
  }

  await updateDoc(userRef, updates);
}

export async function claimBirthdayBonus(firestore: Firestore, userId: string) {
    const year = new Date().getFullYear();
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        points: increment(BIRTHDAY_BONUS_XP),
        birthdayBonusLastClaimedYear: year
    });
}

export async function extendProfileLimit(firestore: Firestore, userId: string) {
    await updateDoc(doc(firestore, 'users', userId), {
        maxSubProfiles: 10
    });
}

export async function createNotification({
  firestore,
  recipientUid,
  title,
  message,
  type,
  link,
}: {
  firestore: Firestore;
  recipientUid: string;
  title: string;
  message: string;
  type: Notification['type'];
  link?: string;
}) {
  const notification: Omit<Notification, 'id'> = {
    recipientUid,
    title,
    message,
    type,
    link,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  await addDoc(collection(firestore, 'notifications'), notification);
}

export async function markNotificationAsRead({ firestore, notificationId }: { firestore: Firestore; notificationId: string }) {
  await updateDoc(doc(firestore, 'notifications', notificationId), { isRead: true });
}

export async function requestVerification({ firestore, storage, userId, paymentMethod, paymentProofFile }: any) {
    const userRef = doc(firestore, 'users', userId);
    const updateData: any = {
        verificationStatus: 'pending',
        verificationRejectionReason: null
    };

    if (paymentMethod === 'offline' && paymentProofFile) {
        const fileRef = ref(storage, `verification-proofs/${userId}/${uuidv4()}.jpg`);
        await uploadBytes(fileRef, paymentProofFile);
        updateData.verificationProofUrl = await getDownloadURL(fileRef);
    }

    await updateDoc(userRef, updateData);
    
    await createNotification({
        firestore,
        recipientUid: 'SYSTEM_ADMIN',
        title: "Nouvelle demande de Badge Bleu 💎",
        message: `L'utilisateur ${userId} a demandé une certification avec paiement ${paymentMethod}.`,
        type: 'rendezvous_new',
        link: '/dashboard/admin/verifications'
    });
}

export async function toggleUserVerification(firestore: Firestore, userId: string, active: boolean, reason?: string) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); 

    const updates: any = {
        isVerified: active,
        verificationStatus: active ? 'verified' : 'rejected',
        verificationExpiresAt: active ? expiresAt.toISOString() : null,
        verificationRejectionReason: active ? null : reason,
        renewalReminderSent: false
    };

    await updateDoc(doc(firestore, 'users', userId), updates);

    if (active) {
        await createNotification({
            firestore,
            recipientUid: userId,
            title: "Badge Bleu Activé ! ✅",
            message: "Félicitations, vous êtes désormais un membre certifié. Profitez de vos nouveaux avantages !",
            type: 'selfie_validated',
            link: '/dashboard'
        });
    } else if (reason) {
        await createNotification({
            firestore,
            recipientUid: userId,
            title: "Demande de Badge Refusée ❌",
            message: `Votre demande a été rejetée. Motif : ${reason}`,
            type: 'rendezvous_declined',
            link: '/dashboard/settings'
        });
    }
}

export async function recordSwipe(firestore: Firestore, userId: string, womanId: string, direction: 'left' | 'right') {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  const data = userDoc.data() as UserProfile;

  if (!data.isVerified && (data.swipesRemaining || 0) <= 0) {
      throw new Error("Limite de swipes atteinte ! Obtenez le Badge Bleu pour des swipes illimités.");
  }

  const updates: any = { lastSwipeDate: new Date().toISOString(), lastActive: new Date().toISOString() };
  if (!data.isVerified) updates.swipesRemaining = increment(-1);

  if (direction === 'right') {
    updates.favorites = arrayUnion(womanId);
    
    // Récompenser la femme aimée (+5 XP de popularité) et incrémenter likesCount
    const womanRef = doc(firestore, 'users', womanId);
    await updateDoc(womanRef, { 
        points: increment(5),
        likesCount: increment(1)
    });

    await createNotification({
        firestore,
        recipientUid: womanId,
        title: "Nouveau Like ! ❤️",
        message: "Quelqu'un a liké votre profil. Vous gagnez +5 XP de popularité !",
        type: 'selfie_validated'
    });
  }

  await updateDoc(userRef, updates);
}

export async function awardPoints({ firestore, userId, points }: { firestore: Firestore; userId: string; points: number; }) {
  const userDocRef = doc(firestore, 'users', userId);
  await updateDoc(userDocRef, { points: increment(points) });
}

export async function signInUser(auth: Auth, email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(auth: Auth) {
  return firebaseSignOut(auth);
}

export async function updateUserProfile({ firestore, storage, userId, data, photoFile }: { firestore: Firestore; storage: FirebaseStorage; userId: string; data: Partial<UserProfile>; photoFile?: File | null; }) {
  if (!userId) throw new Error("ID utilisateur manquant.");
  
  const updateData: Partial<UserProfile> = { ...data, lastActive: new Date().toISOString() };
  
  if (photoFile) {
    const filePath = `profile-photos/${userId}/main-${uuidv4()}.jpg`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, photoFile);
    const photoUrl = await getDownloadURL(fileRef);
    updateData.photoUrl = photoUrl;
  }
  
  await updateDoc(doc(firestore, 'users', userId), updateData);
}

export async function uploadSecondaryPhoto({ firestore, storage, userId, file }: { firestore: Firestore; storage: FirebaseStorage; userId: string; file: File; }) {
    const filePath = `profile-photos/${userId}/secondary-${uuidv4()}.jpg`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const photoUrl = await getDownloadURL(fileRef);
    const photoObj = { url: photoUrl, createdAt: new Date().toISOString() };
    await updateDoc(doc(firestore, 'users', userId), { secondaryPhotos: arrayUnion(photoObj), lastActive: new Date().toISOString() });
    return photoUrl;
}

export async function deleteSecondaryPhoto({ firestore, storage, userId, photoUrl }: { firestore: Firestore; storage: FirebaseStorage; userId: string; photoUrl: string; }) {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const data = userDoc.data() as UserProfile;
    const photoToDelete = data.secondaryPhotos?.find(p => p.url === photoUrl);
    if (photoToDelete) {
        await updateDoc(userRef, { secondaryPhotos: arrayRemove(photoToDelete), lastActive: new Date().toISOString() });
    }
}

export async function proposeRendezvous({ firestore, storage, manUid, womanUid, data, paymentMethod, paymentProofFile }: any) {
    const userRef = doc(firestore, 'users', manUid);
    const userDoc = await getDoc(userRef);
    const userProfile = userDoc.data() as UserProfile;

    if (paymentMethod === 'xp') {
        if ((userProfile.points || 0) < RENDEZVOUS_FEE_XP) {
            throw new Error(`Points XP insuffisants (${RENDEZVOUS_FEE_XP} XP requis).`);
        }
        await updateDoc(userRef, { points: increment(-RENDEZVOUS_FEE_XP) });
    }

    const rdvCollectionRef = collection(firestore, 'rendezvous');
    const newRendezvous: any = { 
        manUid, 
        womanUid, 
        status: 'pending', 
        proposedDate: data.proposedDate.toISOString(), 
        location: data.location, 
        notes: data.notes || '', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(), 
        mysteryBoxClaimed: false,
        paymentMethod
    };
    
    if (paymentMethod === 'offline' && paymentProofFile) {
        const fileRef = ref(storage, `payment-proofs/${uuidv4()}.jpg`);
        await uploadBytes(fileRef, paymentProofFile);
        newRendezvous.paymentProofUrl = await getDownloadURL(fileRef);
        newRendezvous.paymentStatus = 'waiting_validation';
    } else {
        newRendezvous.paymentStatus = 'paid';
    }

    const docRef = await addDoc(rdvCollectionRef, newRendezvous);
    await updateDoc(userRef, { lastActive: new Date().toISOString() });

    // Notification à la femme
    await createNotification({
        firestore,
        recipientUid: womanUid,
        title: "Nouvelle Proposition ! ❤️",
        message: `Un membre souhaite vous rencontrer à ${data.location}. Consultez les détails.`,
        type: 'rendezvous_new',
        link: '/dashboard/woman/rendezvous'
    });

    return docRef.id;
}

export async function updateRendezvousStatus({ firestore, rendezvousId, status }: any) {
  await updateDoc(doc(firestore, 'rendezvous', rendezvousId), { status: status, updatedAt: new Date().toISOString() });
}

export async function validateRendezvousProof({ firestore, rendezvousId, approved }: any) {
    const rdvRef = doc(firestore, "rendezvous", rendezvousId);
    const rdvSnap = await getDoc(rdvRef);
    if (!rdvSnap.exists()) return;
    const rdvData = rdvSnap.data();

    const updateData: any = { selfieValidationStatus: approved ? 'approved' : 'rejected', updatedAt: new Date().toISOString() };
    if (approved) {
        updateData.status = 'completed';

        const manUid = rdvData.manUid;
        const manRef = doc(firestore, 'users', manUid);
        const manSnap = await getDoc(manRef);
        const manProfile = manSnap.data() as UserProfile;

        const q = query(collection(firestore, 'rendezvous'), where('manUid', '==', manUid), where('status', '==', 'completed'), limit(1));
        const completedSnap = await getDocs(q);

        if (completedSnap.empty && manProfile.referredBy) {
            const inviterQuery = query(collection(firestore, 'users'), where('referralCode', '==', manProfile.referredBy), limit(1));
            const inviterSnap = await getDocs(inviterQuery);
            if (!inviterSnap.empty) {
                const inviterId = inviterSnap.docs[0].id;
                await awardPoints({ firestore, userId: inviterId, points: 20 });
                await createNotification({
                    firestore,
                    recipientUid: inviterId,
                    title: "Bonus Parrainage ! 🎁",
                    message: `Votre ami ${manProfile.name} a validé son premier RDV. Vous gagnez 20 XP !`,
                    type: 'payment_validated'
                });
            }
        }
    }
    await updateDoc(rdvRef, updateData);
}

export async function validatePayment({ firestore, rendezvousId, approved }: any) {
  await updateDoc(doc(firestore, 'rendezvous', rendezvousId), { paymentStatus: approved ? 'paid' : 'rejected', status: approved ? 'pending' : 'pending_payment', updatedAt: new Date().toISOString() });
}

export async function toggleFavorite({ firestore, manUid, womanUid }: any) {
  const manRef = doc(firestore, 'users', manUid);
  const profile = (await getDoc(manRef)).data() as UserProfile;
  const isFav = profile.favorites?.includes(womanUid);
  await updateDoc(manRef, { favorites: isFav ? arrayRemove(womanUid) : arrayUnion(womanUid), lastActive: new Date().toISOString() });
  return !isFav;
}

export async function cancelRendezvous({ firestore, rendezvousId }: any) {
  await updateDoc(doc(firestore, 'rendezvous', rendezvousId), { status: 'cancelled', updatedAt: new Date().toISOString() });
}

export async function confirmQrScan({ firestore, rendezvousId, location }: any) {
  await updateDoc(doc(firestore, 'rendezvous', rendezvousId), { qrCodeScanned: true, scanLocation: location, updatedAt: new Date().toISOString() });
}

export async function uploadSelfieProof({ firestore, storage, rendezvousId, selfieFile }: any) {
  // 1. Upload photo
  const fileRef = ref(storage, `rendezvous-proofs/${rendezvousId}/${uuidv4()}.jpg`);
  await uploadBytes(fileRef, selfieFile);
  const url = await getDownloadURL(fileRef);
  
  // 2. Get Rendezvous Info
  const rdvRef = doc(firestore, 'rendezvous', rendezvousId);
  const rdvSnap = await getDoc(rdvRef);
  if (!rdvSnap.exists()) return;
  const rdvData = rdvSnap.data();
  const womanUid = rdvData.womanUid;

  // 3. Update doc for Admin validation
  await updateDoc(rdvRef, { 
    selfieProofUrl: url, 
    selfieValidationStatus: 'pending', 
    updatedAt: new Date().toISOString() 
  });

  // 4. Award 1800 XP to the Woman IMMEDIATELY
  await awardPoints({ firestore, userId: womanUid, points: WOMAN_RDV_REWARD_XP });

  // 5. Notify Woman about her credit
  await createNotification({
    firestore,
    recipientUid: womanUid,
    title: "Crédit 1800 XP ! 💰",
    message: `Votre preuve a été soumise. Vous avez reçu ${WOMAN_RDV_REWARD_XP} XP en récompense !`,
    type: 'payment_validated'
  });

  // 6. Notify Admin to validate
  await createNotification({
    firestore,
    recipientUid: 'SYSTEM_ADMIN',
    title: "Preuve de rencontre à valider 📸",
    message: `Une nouvelle preuve de selfie a été soumise pour le rendez-vous ${rendezvousId}.`,
    type: 'rendezvous_new',
    link: '/dashboard/admin/validations'
  });
}

export async function publishGame({ firestore, creatorUid, game }: any) {
  const newGame = { creatorUid, gameType: game.gameType, title: game.title, content: game, createdAt: new Date().toISOString() };
  const docRef = await addDoc(collection(firestore, 'games'), newGame);
  return { id: docRef.id, ...newGame };
}

export async function completeQuest({ firestore, userId, questId, points }: { firestore: Firestore; userId: string; questId: string; points: number }) {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    completedQuests: arrayUnion(questId),
    points: increment(points),
    lastActive: new Date().toISOString()
  });
}

export async function createWithdrawalRequest({
  firestore,
  userId,
  userName,
  points,
  paymentInfo,
}: {
  firestore: Firestore;
  userId: string;
  userName: string;
  points: number;
  paymentInfo: string;
}) {
  const grossAmount = points * POINTS_CONVERSION_RATE;
  const netAmount = grossAmount * (1 - WITHDRAWAL_FEE_PERCENTAGE);
  
  await addDoc(collection(firestore, 'withdrawals'), {
    userId,
    userName,
    points,
    amount: netAmount,
    grossAmount,
    fee: grossAmount * WITHDRAWAL_FEE_PERCENTAGE,
    status: 'pending',
    paymentMethod: 'MoMo/Airtel Money',
    paymentInfo,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(doc(firestore, 'users', userId), {
    points: increment(-points),
    lastActive: new Date().toISOString()
  });
  await createNotification({
    firestore,
    recipientUid: userId,
    title: "Demande de retrait reçue 💸",
    message: `Votre demande de retrait de ${netAmount} FCFA (après frais de 20%) est en attente.`,
    type: 'payment_validated'
  });
}

export async function processWithdrawal({
  firestore,
  withdrawalId,
  approved,
}: {
  firestore: Firestore;
  withdrawalId: string;
  approved: boolean;
}) {
  const withdrawalRef = doc(firestore, 'withdrawals', withdrawalId);
  const snap = await getDoc(withdrawalRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const status = approved ? 'processed' : 'rejected';
  await updateDoc(withdrawalRef, {
    status,
    processedAt: new Date().toISOString()
  });
  if (!approved) {
    await updateDoc(doc(firestore, 'users', data.userId), {
      points: increment(data.points)
    });
  }
  await createNotification({
    firestore,
    recipientUid: data.userId,
    title: approved ? "Virement effectué ! ✅" : "Demande de retrait rejetée ❌",
    message: approved 
      ? `Votre virement de ${data.amount} FCFA a été traité.`
      : `Votre demande a été rejetée. Vos ${data.points} points ont été restitués.`,
    type: approved ? 'payment_validated' : 'payment_rejected'
  });
}

export async function markAllNotificationsAsRead({ firestore, userId }: { firestore: Firestore; userId: string }) {
    const q = query(collection(firestore, 'notifications'), where('recipientUid', '==', userId), where('isRead', '==', false));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
}

export async function deleteUserProfile(firestore: Firestore, userId: string) {
    await deleteDoc(doc(firestore, 'users', userId));
}

export async function createPost({ firestore, storage, userId, text, photoFile }: any) {
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  const profile = userDoc.data() as UserProfile;
  let imageUrl = undefined;
  if (photoFile) {
    const fileRef = ref(storage, `posts/${userId}/${uuidv4()}.jpg`);
    await uploadBytes(fileRef, photoFile);
    imageUrl = await getDownloadURL(fileRef);
  }
  const newPost = { creatorUid: userId, creatorName: profile.name, creatorPhotoUrl: profile.photoUrl || '', text, imageUrl, createdAt: new Date().toISOString(), likesCount: 0 };
  await addDoc(collection(firestore, 'posts'), newPost);
  await updateDoc(doc(firestore, 'users', userId), { lastActive: new Date().toISOString() });
}

export async function likePost({ firestore, userId, postId }: any) {
    await updateDoc(doc(firestore, 'posts', postId), { likesCount: increment(1) });
    await updateDoc(doc(firestore, 'users', userId), { lastActive: new Date().toISOString() });
}

export async function createStory({ firestore, storage, userId, photoFile }: any) {
  const fileRef = ref(storage, `stories/${userId}/${uuidv4()}.jpg`);
  await uploadBytes(fileRef, photoFile);
  const imageUrl = await getDownloadURL(fileRef);
  const expiresAt = new Date(); expiresAt.setHours(expiresAt.getHours() + 24);
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  const profile = userDoc.data() as UserProfile;
  const newStory = { creatorUid: userId, creatorName: profile.name, creatorPhotoUrl: profile.photoUrl || '', imageUrl, createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() };
  await addDoc(collection(firestore, 'stories'), newStory);
  await updateDoc(doc(firestore, 'users', userId), { lastActive: new Date().toISOString() });
}

export async function boostProfile({ firestore, userId }: { firestore: Firestore, userId: string }) {
    const userRef = doc(firestore, 'users', userId);
    const snap = await getDoc(userRef);
    const profile = snap.data() as UserProfile;
    
    if ((profile.points || 0) < BOOST_PROFILE_XP) {
        throw new Error(`Points XP insuffisants (${BOOST_PROFILE_XP} XP requis pour un boost).`);
    }

    await updateDoc(userRef, {
        points: increment(-BOOST_PROFILE_XP),
        boostExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date().toISOString()
    });
}

export async function submitDonationRequest({ firestore, storage, userId, userName, amount, proofFile }: any) {
    const fileRef = ref(storage, `donation-proofs/${userId}/${uuidv4()}.jpg`);
    await uploadBytes(fileRef, proofFile);
    const proofUrl = await getDownloadURL(fileRef);

    await addDoc(collection(firestore, 'donations'), {
        userId,
        userName,
        amount,
        proofUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    await createNotification({
        firestore,
        recipientUid: 'SYSTEM_ADMIN',
        title: "Nouveau Don Reçu ! 🎁",
        message: `${userName} a fait un don de ${amount} FCFA. Preuve à vérifier.`,
        type: 'rendezvous_new',
        link: '/dashboard/admin/donations'
    });
}

export async function validateDonation({ firestore, donationId, approved }: any) {
    const donationRef = doc(firestore, 'donations', donationId);
    const snap = await getDoc(donationRef);
    if (!snap.exists()) return;
    const data = snap.data();

    await updateDoc(donationRef, {
        status: approved ? 'approved' : 'rejected',
        validatedAt: new Date().toISOString()
    });

    if (approved) {
        await addDoc(collection(firestore, 'rendezvous'), {
            manUid: data.userId,
            womanUid: 'SYSTEM',
            status: 'completed',
            mysteryBoxClaimed: false,
            location: 'Donation Reward',
            proposedDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDonationReward: true
        });

        await createNotification({
            firestore,
            recipientUid: data.userId,
            title: "Don Validé ! 🎁",
            message: "Votre don a été validé. Un Coffre Mystère vous attend sur votre tableau de bord !",
            type: 'selfie_validated',
            link: '/dashboard'
        });
    }
}

export async function spinWheel({ firestore, userId, rewardPoints }: { firestore: Firestore, userId: string, rewardPoints: number }) {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
        points: increment(rewardPoints - WHEEL_SPIN_COST),
        lastActive: new Date().toISOString()
    });
}

export async function purchaseContactPack({ firestore, userId, paymentMethod }: { firestore: Firestore; userId: string; paymentMethod: 'fcfa' | 'xp' }) {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;

    if (paymentMethod === 'xp') {
        if ((userData.points || 0) < CONTACT_PACK_FEE_XP) {
            throw new Error(`Points XP insuffisants (${CONTACT_PACK_FEE_XP} XP requis).`);
        }
        await updateDoc(userRef, { points: increment(-CONTACT_PACK_FEE_XP) });
    }

    const womenQuery = query(collection(firestore, 'users'), where('role', '==', 'woman'), limit(100));
    const womenSnap = await getDocs(womenQuery);
    const allWomenIds = womenSnap.docs.map(d => d.id);

    const shuffled = allWomenIds.sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, 20);

    await updateDoc(userRef, {
        unlockedContacts: arrayUnion(...selectedIds),
        lastActive: new Date().toISOString()
    });

    await createNotification({
        firestore,
        recipientUid: userId,
        title: "Pack de Contacts Activé ! 📱",
        message: `Félicitations ! Vous avez débloqué 20 profils. Vous pouvez désormais leur envoyer des messages directs gratuitement.`,
        type: 'selfie_validated',
        link: '/dashboard/man/browse'
    });

    return selectedIds;
}

export async function transferXp({ firestore, fromUserId, toUserId, amount }: any) {
    if (amount <= 0) throw new Error("Montant invalide.");
    
    const fromRef = doc(firestore, 'users', fromUserId);
    const fromSnap = await getDoc(fromRef);
    const fromData = fromSnap.data() as UserProfile;

    if ((fromData.points || 0) < amount) throw new Error("XP insuffisants.");

    const toRef = doc(firestore, 'users', toUserId);
    const batch = writeBatch(firestore);
    
    batch.update(fromRef, { points: increment(-amount) });
    batch.update(toRef, { points: increment(amount) });
    
    await batch.commit();

    await createNotification({
        firestore,
        recipientUid: toUserId,
        title: "Cadeau XP reçu ! 🎁",
        message: `${fromData.name} vous a envoyé ${amount} XP.`,
        type: 'payment_validated'
    });
}
