import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Card, Purchase } from '../types';

/**
 * Operações para contas autenticadas. Não lê nem altera os dados legados
 * guardados sob users/{parcelacard_sync_id}.
 *
 * A autorização real deve ser aplicada também nas regras do Firestore:
 * request.auth.uid == userId.
 */
function authenticatedUid(): string {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('Faça login para acessar seus dados na nuvem.');
  if (!db) throw new Error('Firestore não configurado.');
  return uid;
}

export async function loadMyCards(): Promise<Card[]> {
  const uid = authenticatedUid();
  const snapshot = await getDocs(collection(db!, 'users', uid, 'cards'));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Card));
}

export async function loadMyPurchases(): Promise<Purchase[]> {
  const uid = authenticatedUid();
  const snapshot = await getDocs(collection(db!, 'users', uid, 'purchases'));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Purchase));
}

export async function saveMyCard(card: Card): Promise<void> {
  const uid = authenticatedUid();
  await setDoc(doc(db!, 'users', uid, 'cards', card.id), card, { merge: true });
}

export async function saveMyPurchase(purchase: Purchase): Promise<void> {
  const uid = authenticatedUid();
  await setDoc(doc(db!, 'users', uid, 'purchases', purchase.id), purchase, { merge: true });
}

export async function deleteMyCard(cardId: string): Promise<void> {
  const uid = authenticatedUid();
  await deleteDoc(doc(db!, 'users', uid, 'cards', cardId));
}

export async function deleteMyPurchase(purchaseId: string): Promise<void> {
  const uid = authenticatedUid();
  await deleteDoc(doc(db!, 'users', uid, 'purchases', purchaseId));
}

/**
 * Copia ou atualiza os registros na conta autenticada, sem excluir dados.
 * Para mais de 500 gravações, a importação deverá ser dividida em lotes.
 * Nunca executar automaticamente ao fazer login.
 */
export async function uploadMyData(cards: Card[], purchases: Purchase[]): Promise<void> {
  const uid = authenticatedUid();
  if (cards.length + purchases.length > 500) {
    throw new Error('Importação acima de 500 registros: é necessário dividir em lotes.');
  }
  const batch = writeBatch(db!);
  cards.forEach(card => batch.set(doc(db!, 'users', uid, 'cards', card.id), card, { merge: true }));
  purchases.forEach(purchase => batch.set(doc(db!, 'users', uid, 'purchases', purchase.id), purchase, { merge: true }));
  await batch.commit();
}
