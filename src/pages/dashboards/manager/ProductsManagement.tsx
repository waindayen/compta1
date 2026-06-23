import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { productsService } from '../../../services/inventory';
import { Product } from '../../../services/inventory/types';
import ProductForm from '../../../components/inventory/ProductForm';
import LoadingState from '../../../components/LoadingState';
import ErrorAlert from '../../../components/ErrorAlert';
import BaseDashboard from '../BaseDashboard';

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, filterCategory, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productsService.getAll();
      setProducts(data);

      const cats = await productsService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    await productsService.create(data);
    await loadProducts();
    setShowForm(false);
  };

  const handleUpdateProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      await productsService.update(editingProduct.id, data);
      await loadProducts();
      setShowForm(false);
      setEditingProduct(undefined);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) return;

    try {
      await productsService.delete(id);
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Produits">
        <LoadingState />
      </BaseDashboard>
    );
  }

  if (error) {
    return (
      <BaseDashboard title="Gestion des Produits">
        <ErrorAlert message={error} />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Produits">
      <div className="space-y-6">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Produit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Catégorie
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Prix Unitaire
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Valeur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus =
                    product.currentStock === 0
                      ? 'text-red-600'
                      : product.currentStock <= product.minStock
                      ? 'text-orange-600'
                      : 'text-green-600';

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {product.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{product.sku}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-bold ${stockStatus}`}>
                            {product.currentStock || 0} {product.unit || ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            Min: {product.minStock || 0} / Max: {product.maxStock || 0}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(product.unitPrice || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {((product.currentStock || 0) * (product.unitPrice || 0)).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onClose={handleCloseForm}
        />
      )}
      </div>
    </BaseDashboard>
  );
}
