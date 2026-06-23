import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Product, Supplier } from '../../services/inventory/types';
import { suppliersService } from '../../services/inventory';
import { getCategories, createCategory, type ProductCategory } from '../../services/inventory/categories';
import { useAuth } from '../../contexts/AuthContext';

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export default function ProductForm({ product, onSubmit, onClose }: ProductFormProps) {
  const { currentUser, userData } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3B82F6',
    icon: ''
  });
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category: product?.category || '',
    unit: product?.unit || 'pcs',
    minStock: product?.minStock || 0,
    maxStock: product?.maxStock || 0,
    currentStock: product?.currentStock || 0,
    unitPrice: product?.unitPrice || 0,
    supplierId: product?.supplierId || ''
  });

  useEffect(() => {
    loadSuppliers();
    loadCategories();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await suppliersService.getActive();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Veuillez entrer un nom de catégorie');
      return;
    }

    if (creatingCategory) return;

    setCreatingCategory(true);

    try {
      const categoryName = newCategory.name.trim();
      const categoryIcon = newCategory.icon.trim() || '📦';

      console.log('=== User Info ===');
      console.log('User ID:', currentUser?.uid);
      console.log('User Email:', currentUser?.email);
      console.log('User Role:', userData?.role);
      console.log('User Status:', userData?.status);
      console.log('User isBlocked:', userData?.isBlocked);
      console.log('=================');
      console.log('Creating category:', { categoryName, categoryIcon, color: newCategory.color });

      const newCategoryData: any = {
        name: categoryName,
        color: newCategory.color,
        icon: categoryIcon,
        is_active: true
      };

      await createCategory(newCategoryData);

      console.log('Category created successfully');

      await loadCategories();

      setFormData(prev => ({ ...prev, category: categoryName }));
      setNewCategory({ name: '', color: '#3B82F6', icon: '' });
      setShowNewCategory(false);
      alert('Catégorie créée avec succès!');
    } catch (error: any) {
      console.error('=== Error Details ===');
      console.error('Full error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error name:', error?.name);
      console.error('====================');

      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie';
      alert(errorMessage);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      alert('Veuillez entrer un nom de fournisseur');
      return;
    }

    if (creatingSupplier) return;

    setCreatingSupplier(true);

    try {
      console.log('=== User Info ===');
      console.log('User ID:', currentUser?.uid);
      console.log('User Email:', currentUser?.email);
      console.log('User Role:', userData?.role);
      console.log('User Status:', userData?.status);
      console.log('User isBlocked:', userData?.isBlocked);
      console.log('=================');
      console.log('Creating supplier:', { name: newSupplier.name.trim(), email: newSupplier.email.trim(), phone: newSupplier.phone.trim() });

      const supplierId = await suppliersService.create({
        name: newSupplier.name.trim(),
        email: newSupplier.email.trim(),
        phone: newSupplier.phone.trim(),
        address: '',
        status: 'active'
      });

      console.log('Supplier created successfully with ID:', supplierId);

      await loadSuppliers();

      setFormData(prev => ({ ...prev, supplierId }));
      setNewSupplier({ name: '', email: '', phone: '' });
      setShowNewSupplier(false);
      alert('Fournisseur créé avec succès!');
    } catch (error: any) {
      console.error('=== Error Details ===');
      console.error('Full error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error name:', error?.name);
      console.error('====================');

      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du fournisseur';
      alert(errorMessage);
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Erreur lors de l\'enregistrement du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {product ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
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
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code-barres
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                    title="Créer une nouvelle catégorie"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showNewCategory && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="font-medium text-sm">Nouvelle catégorie</h4>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Électronique"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Icône</label>
                        <input
                          type="text"
                          value={newCategory.icon}
                          onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: 📦"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Couleur</label>
                        <input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-full h-8 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory}
                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingCategory ? 'Création...' : 'Créer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategory({ name: '', color: '#3B82F6', icon: '' });
                        }}
                        disabled={creatingCategory}
                        className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité *
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pcs">Pièces</option>
                  <option value="box">Boîtes</option>
                  <option value="kg">Kilogrammes</option>
                  <option value="l">Litres</option>
                  <option value="m">Mètres</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock minimum *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock maximum *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock actuel *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
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
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fournisseur *
                </label>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewSupplier(!showNewSupplier)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                    title="Créer un nouveau fournisseur"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showNewSupplier && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="font-medium text-sm">Nouveau fournisseur</h4>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Fournisseur ABC"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={newSupplier.email}
                          onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={newSupplier.phone}
                          onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="+237 XXX XXX XXX"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateSupplier}
                        disabled={creatingSupplier}
                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingSupplier ? 'Création...' : 'Créer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewSupplier(false);
                          setNewSupplier({ name: '', email: '', phone: '' });
                        }}
                        disabled={creatingSupplier}
                        className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : product ? 'Modifier' : 'Créer'}
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
