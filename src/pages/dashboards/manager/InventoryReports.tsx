import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';
import { productsService, movementsService } from '../../../services/inventory';
import LoadingState from '../../../components/LoadingState';
import ErrorAlert from '../../../components/ErrorAlert';
import BaseDashboard from '../BaseDashboard';

export default function InventoryReports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalMovements: 0,
    totalIn: 0,
    totalOut: 0,
    totalValueIn: 0,
    totalValueOut: 0
  });
  const [categories, setCategories] = useState<{ name: string; count: number; value: number }[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      const [products, movementStats, totalValue, lowStock, outOfStock, allCategories] = await Promise.all([
        productsService.getAll(),
        movementsService.getStats(),
        productsService.getTotalValue(),
        productsService.getLowStock(),
        productsService.getOutOfStock(),
        productsService.getCategories()
      ]);

      const categoryStats = allCategories.map(cat => {
        const categoryProducts = products.filter(p => p.category === cat);
        const value = categoryProducts.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
        return {
          name: cat,
          count: categoryProducts.length,
          value
        };
      });

      setStats({
        totalProducts: products.length,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalMovements: movementStats.totalMovements,
        totalIn: movementStats.totalIn,
        totalOut: movementStats.totalOut,
        totalValueIn: movementStats.totalValueIn,
        totalValueOut: movementStats.totalValueOut
      });

      setCategories(categoryStats.sort((a, b) => b.value - a.value));
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Rapports d'Inventaire">
        <LoadingState />
      </BaseDashboard>
    );
  }

  if (error) {
    return (
      <BaseDashboard title="Rapports d'Inventaire">
        <ErrorAlert message={error} />
      </BaseDashboard>
    );
  }

  const profit = stats.totalValueOut - stats.totalValueIn;

  return (
    <BaseDashboard title="Rapports d'Inventaire">
      <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produits Totaux</p>
              <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Valeur Totale</p>
              <p className="text-2xl font-bold mt-2">
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
              <p className="text-gray-600 text-sm">Mouvements</p>
              <p className="text-3xl font-bold mt-2">{stats.totalMovements}</p>
              <p className="text-xs text-gray-500">
                {stats.totalIn} entrées / {stats.totalOut} sorties
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Bénéfice</p>
              <p className={`text-2xl font-bold mt-2 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(profit || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">FCFA</p>
            </div>
            <BarChart3 className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Produits par Catégorie</h2>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune catégorie trouvée</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-600">
                      {category.count} produit{category.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${stats.totalValue ? (category.value / stats.totalValue) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {(category.value || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Résumé des Mouvements</h2>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Entrées Totales</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalIn}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Valeur</p>
                  <p className="text-lg font-bold text-green-700">
                    {(stats.totalValueIn || 0).toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Sorties Totales</p>
                  <p className="text-2xl font-bold text-red-700">{stats.totalOut}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Valeur</p>
                  <p className="text-lg font-bold text-red-700">
                    {(stats.totalValueOut || 0).toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Stock Faible</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.lowStockCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Rupture</p>
                  <p className="text-2xl font-bold text-red-700">{stats.outOfStockCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </BaseDashboard>
  );
}
