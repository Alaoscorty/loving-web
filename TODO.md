# TODO
- [ ] Comprendre le flux actuel des retraits (création, lecture admin, traitement approuver/rejeter) et repérer les problèmes (permissions et envoi notification).
- [ ] Ajouter une entrée au sidebar admin pour afficher la page des retraits (compte rendu + badge “pending”).
- [ ] Vérifier / corriger `processWithdrawal` : restitution XP au rejet, et (si approuvé) application correcte du virement (et crédit/notification).
- [ ] Corriger les permissions Firestore pour s’assurer que :
  - l’utilisateur ne peut voir que ses retraits
  - l’admin peut lire et mettre à jour uniquement les retraits
  - éviter toute faille où un user pourrait modifier un retrait d’un autre
- [ ] Ajouter/ajuster notifications pour informer l’utilisateur du statut (approuvé/rejeté) et éventuellement créer un canal admin.
- [ ] Mettre à jour les pages si nécessaire (ex: wallet + admin/withdrawals) pour refléter les statuts attendus.
- [ ] Lancer le build / tests (ou typecheck) pour valider compilation.

