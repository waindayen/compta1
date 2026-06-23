import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StockMovement, Product, Supplier } from '../../services/inventory/types';
import { productsService, suppliersService } from '../../services/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { getDisplayName } from '../../utils/userUtils';

interface MovementFormProps {
  onSubmit: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

export default function MovementForm({ onSubmit, onClose }: MovementFormProps) {
  const { currentUser, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    unitPrice: 0,
    reason: '',
    reference: '',
    supplierId: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === formData.productId);
      setSelectedProduct(product || null);
      if (product) {
        setFormData(prev => ({ ...prev, unitPrice: product.unitPrice || 0 }));
      }
    }
  }, [formData.productId, products]);

  const loadData = async () => {
    try {
      const [productsData, suppliersData] = await Promise.all([
        productsService.getAll(),
        suppliersService.getActive()
      ]);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert('Veuillez sélectionner un produit');
      return;
    }

    if (formData.type === 'out' && formData.quantity > selectedProduct.currentStock) {
      alert('Quantité insuffisante en stock');
      return;
    }

    setLoading(true);

    try {
      const supplier = suppliers.find(s => s.id === formData.supplierId);

      const movementData: any = {
        productId: formData.productId,
        productName: selectedProduct.name,
        type: formData.type,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalPrice: formData.quantity * formData.unitPrice,
        reason: formData.reason,
        performedBy: currentUser?.uid || '',
        performedByName: getDisplayName(userData)
      };

      if (formData.reference && formData.reference.trim()) {
        movementData.reference = formData.reference.trim();
      }
      if (formData.supplierId) {
        movementData.supplierId = formData.supplierId;
      }
      if (supplier?.name) {
        movementData.supplierName = supplier.name;
      }
      if (formData.notes && formData.notes.trim()) {
        movementData.notes = formData.notes.trim();
      }

      await onSubmit(movementData);
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du mouvement';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = (formData.quantity || 0) * (formData.unitPrice || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Nouveau mouvement de stock</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de mouvement *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'in' | 'out' | 'adjustment' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in">Entrée</option>
                  <option value="out">Sortie</option>
                  <option value="adjustment">Ajustement</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit *
                </label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.currentStock} {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="col-span-2 bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Stock actuel:</strong> {selectedProduct.currentStock || 0} {selectedProduct.unit}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Prix unitaire:</strong> {(selectedProduct.unitPrice || 0).toLocaleString()} FCFA
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix unitaire (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.unitPrice || ''}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {totalPrice > 0 && (
                <div className="col-span-2 bg-green-50 p-3 rounded-lg">
                  <p className="text-lg font-semibold text-green-700">
                    Prix total: {(totalPrice || 0).toLocaleString()} FCFA
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ex: Achat, Vente, Retour, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="N° facture, bon de commande, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.type === 'in' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
