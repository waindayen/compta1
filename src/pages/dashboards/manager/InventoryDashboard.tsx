import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productsService, movementsService } from '../../../services/inventory';
import { Product, StockMovement } from '../../../services/inventory/types';
import LoadingState from '../../../components/LoadingState';
import ErrorAlert from '../../../components/ErrorAlert';
import BaseDashboard from '../BaseDashboard';

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [products, movements, lowStock] = await Promise.all([
        productsService.getAll(),
        movementsService.getRecent(10),
        productsService.getLowStock()
      ]);

      const totalValue = await productsService.getTotalValue();
      const outOfStock = products.filter(p => p.currentStock === 0);

      setStats({
        totalProducts: products.length,
        totalValue,
        lowStockProducts: lowStock.length,
        outOfStockProducts: outOfStock.length
      });

      setRecentMovements(movements);
      setLowStockProducts(lowStock.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Tableau de Bord Inventaire">
        <LoadingState />
      </BaseDashboard>
    );
  }

  if (error) {
    return (
      <BaseDashboard title="Tableau de Bord Inventaire">
        <ErrorAlert message={error} />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Tableau de Bord Inventaire">
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produits</p>
              <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Valeur Totale</p>
              <p className="text-3xl font-bold mt-2">
                {(stats.totalValue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">FCFA</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Stock Faible</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                {stats.lowStockProducts}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rupture</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {stats.outOfStockProducts}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Produits en Stock Faible</h2>
            <Link
              to="/dashboard/manager/inventory/products"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun produit en stock faible
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {product.currentStock || 0} {product.unit || ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      Min: {product.minStock || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Mouvements Récents</h2>
            <Link
              to="/dashboard/manager/inventory/movements"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun mouvement récent
            </p>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{movement.productName}</p>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                    <p className="text-xs text-gray-500">
                      {movement.createdAt.toLocaleDateString()} à{' '}
                      {movement.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        movement.type === 'in'
                          ? 'bg-green-100 text-green-700'
                          : movement.type === 'out'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Ajustement'}
                    </span>
                    <p className="font-bold mt-1">
                      {movement.type === 'out' ? '-' : '+'}
                      {movement.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/dashboard/manager/inventory/products"
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Package className="w-8 h-8 mb-2" />
          <h3 className="text-xl font-bold">Gérer les Produits</h3>
          <p className="text-sm opacity-90 mt-1">
            Ajouter, modifier et supprimer des produits
          </p>
        </Link>

        <Link
          to="/dashboard/manager/inventory/suppliers"
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Package className="w-8 h-8 mb-2" />
          <h3 className="text-xl font-bold">Gérer les Fournisseurs</h3>
          <p className="text-sm opacity-90 mt-1">
            Gérer vos fournisseurs
          </p>
        </Link>

        <Link
          to="/dashboard/manager/inventory/movements"
          className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <TrendingUp className="w-8 h-8 mb-2" />
          <h3 className="text-xl font-bold">Mouvements de Stock</h3>
          <p className="text-sm opacity-90 mt-1">
            Voir l'historique des mouvements
          </p>
        </Link>
      </div>
      </div>
    </BaseDashboard>
  );
}
