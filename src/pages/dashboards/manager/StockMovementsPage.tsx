import React, { useState, useEffect } from 'react';
import { Plus, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { movementsService } from '../../../services/inventory';
import { StockMovement } from '../../../services/inventory/types';
import MovementForm from '../../../components/inventory/MovementForm';
import LoadingState from '../../../components/LoadingState';
import ErrorAlert from '../../../components/ErrorAlert';
import BaseDashboard from '../BaseDashboard';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await movementsService.getAll();
      setMovements(data);
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Erreur lors du chargement des mouvements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovement = async (data: Omit<StockMovement, 'id' | 'createdAt'>) => {
    await movementsService.create(data);
    await loadMovements();
    setShowForm(false);
  };

  const filteredMovements = filterType === 'all'
    ? movements
    : movements.filter(m => m.type === filterType);

  if (loading) {
    return (
      <BaseDashboard title="Mouvements de Stock">
        <LoadingState />
      </BaseDashboard>
    );
  }

  if (error) {
    return (
      <BaseDashboard title="Mouvements de Stock">
        <ErrorAlert message={error} />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Mouvements de Stock">
      <div className="space-y-6">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Mouvement
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                filterType === 'in'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              Entrées
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                filterType === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              Sorties
            </button>
            <button
              onClick={() => setFilterType('adjustment')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                filterType === 'adjustment'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Ajustements
            </button>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun mouvement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Produit
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Prix Unitaire
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Raison
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Effectué par
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p>{movement.createdAt.toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          {movement.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          movement.type === 'in'
                            ? 'bg-green-100 text-green-700'
                            : movement.type === 'out'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {movement.type === 'in' && <ArrowUp className="w-3 h-3" />}
                        {movement.type === 'out' && <ArrowDown className="w-3 h-3" />}
                        {movement.type === 'adjustment' && <RefreshCw className="w-3 h-3" />}
                        {movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Ajustement'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{movement.productName}</p>
                      {movement.supplierName && (
                        <p className="text-xs text-gray-500">{movement.supplierName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {movement.type === 'out' ? '-' : '+'}
                      {movement.quantity || 0}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(movement.unitPrice || 0).toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {(movement.totalPrice || 0).toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p>{movement.reason}</p>
                      {movement.reference && (
                        <p className="text-xs text-gray-500">Réf: {movement.reference}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {movement.performedByName || <span className="text-gray-400 italic">Non renseigné</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <MovementForm
          onSubmit={handleCreateMovement}
          onClose={() => setShowForm(false)}
        />
      )}
      </div>
    </BaseDashboard>
  );
}
