import { db, isFirebaseConfigured } from './firebase';
import { Card, Purchase } from '../types';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

// Get or create a persistent sync/user ID for the cloud
export function getOrCreateSyncId(): string {
  let syncId = localStorage.getItem('parcelacard_sync_id');
  if (!syncId) {
    // Generate a clean human-readable short UUID-like string
    syncId = 'user_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('parcelacard_sync_id', syncId);
  }
  return syncId;
}

export function saveSyncId(newSyncId: string): void {
  localStorage.setItem('parcelacard_sync_id', newSyncId.trim());
}

// Cards DB operations
export async function loadCards(syncId: string): Promise<Card[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado');
  }
  
  const cardsCol = collection(db, 'users', syncId, 'cards');
  const querySnapshot = await getDocs(cardsCol);
  const loadedCards: Card[] = [];
  querySnapshot.forEach((docSnap) => {
    loadedCards.push({ id: docSnap.id, ...docSnap.data() } as Card);
  });
  return loadedCards;
}

export async function saveCard(syncId: string, card: Card): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const cardDoc = doc(db, 'users', syncId, 'cards', card.id);
  await setDoc(cardDoc, card, { merge: true });
}

export async function deleteCard(syncId: string, cardId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const cardDoc = doc(db, 'users', syncId, 'cards', cardId);
  await deleteDoc(cardDoc);
}

// Purchases DB operations
export async function loadPurchases(syncId: string): Promise<Purchase[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado');
  }
  
  const purchasesCol = collection(db, 'users', syncId, 'purchases');
  const querySnapshot = await getDocs(purchasesCol);
  const loadedPurchases: Purchase[] = [];
  querySnapshot.forEach((docSnap) => {
    loadedPurchases.push({ id: docSnap.id, ...docSnap.data() } as Purchase);
  });
  return loadedPurchases;
}

export async function savePurchase(syncId: string, purchase: Purchase): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const purchaseDoc = doc(db, 'users', syncId, 'purchases', purchase.id);
  await setDoc(purchaseDoc, purchase, { merge: true });
}

export async function deletePurchase(syncId: string, purchaseId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const purchaseDoc = doc(db, 'users', syncId, 'purchases', purchaseId);
  await deleteDoc(purchaseDoc);
}

// Bulk sync utility (e.g. upload existing localStorage to cloud, or import files)
export async function uploadAllDataToCloud(syncId: string, cards: Card[], purchases: Purchase[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  
  const batch = writeBatch(db);
  
  // Add cards to batch
  cards.forEach((card) => {
    const cardDoc = doc(db, 'users', syncId, 'cards', card.id);
    batch.set(cardDoc, card, { merge: true });
  });
  
  // Add purchases to batch
  purchases.forEach((purchase) => {
    const purchaseDoc = doc(db, 'users', syncId, 'purchases', purchase.id);
    batch.set(purchaseDoc, purchase, { merge: true });
  });
  
  await batch.commit();
}
