import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StockMovement } from './types';
import { productsService } from './products';

const COLLECTION_NAME = 'stock_movements';

export const movementsService = {
  async getAll(): Promise<StockMovement[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as StockMovement[];

    movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return movements;
  },

  async getById(id: string): Promise<StockMovement | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as StockMovement;
  },

  async getByProduct(productId: string): Promise<StockMovement[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as StockMovement[];

    movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return movements;
  },

  async getRecent(maxResults: number = 10): Promise<StockMovement[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as StockMovement[];

    movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return movements.slice(0, maxResults);
  },

  async getByType(type: 'in' | 'out' | 'adjustment'): Promise<StockMovement[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('type', '==', type)
    );
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as StockMovement[];

    movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return movements;
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<StockMovement[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as StockMovement[];

    movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return movements;
  },

  async create(
    movement: Omit<StockMovement, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const batch = writeBatch(db);

      const movementData: any = {
        productId: movement.productId,
        productName: movement.productName,
        type: movement.type,
        quantity: movement.quantity,
        unitPrice: movement.unitPrice,
        totalPrice: movement.totalPrice,
        reason: movement.reason,
        performedBy: movement.performedBy,
        performedByName: movement.performedByName,
        createdAt: Timestamp.now()
      };

      if (movement.reference) {
        movementData.reference = movement.reference;
      }
      if (movement.supplierId) {
        movementData.supplierId = movement.supplierId;
      }
      if (movement.supplierName) {
        movementData.supplierName = movement.supplierName;
      }
      if (movement.notes) {
        movementData.notes = movement.notes;
      }

      const movementRef = doc(collection(db, COLLECTION_NAME));
      batch.set(movementRef, movementData);

    const productRef = doc(db, 'products', movement.productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const currentStock = productSnap.data().currentStock || 0;
      let newStock = currentStock;

      if (movement.type === 'in') {
        newStock = currentStock + movement.quantity;
      } else if (movement.type === 'out') {
        newStock = currentStock - movement.quantity;
      } else if (movement.type === 'adjustment') {
        newStock = movement.quantity;
      }

      batch.update(productRef, {
        currentStock: newStock,
        updatedAt: Timestamp.now()
      });
    }

      await batch.commit();
      return movementRef.id;
    } catch (error: any) {
      console.error('Error creating movement:', error);

      if (error?.code === 'permission-denied') {
        throw new Error('Vous n\'avez pas la permission de créer un mouvement de stock. Seuls les Managers et Admins peuvent effectuer cette action.');
      }

      if (error?.code === 'unauthenticated') {
        throw new Error('Vous devez être connecté pour créer un mouvement de stock.');
      }

      const errorMessage = error?.message || 'Erreur lors de la création du mouvement de stock';
      throw new Error(errorMessage);
    }
  },

  async getTotalValue(type?: 'in' | 'out' | 'adjustment'): Promise<number> {
    let movements: StockMovement[];

    if (type) {
      movements = await this.getByType(type);
    } else {
      movements = await this.getAll();
    }

    return movements.reduce((total, movement) => {
      return total + movement.totalPrice;
    }, 0);
  },

  async getStats(startDate?: Date, endDate?: Date) {
    let movements: StockMovement[];

    if (startDate && endDate) {
      movements = await this.getByDateRange(startDate, endDate);
    } else {
      movements = await this.getAll();
    }

    const stats = {
      totalMovements: movements.length,
      totalIn: movements.filter(m => m.type === 'in').length,
      totalOut: movements.filter(m => m.type === 'out').length,
      totalAdjustments: movements.filter(m => m.type === 'adjustment').length,
      totalValueIn: movements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.totalPrice, 0),
      totalValueOut: movements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.totalPrice, 0)
    };

    return stats;
  }
};
