import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { suppliersService } from '../../../services/inventory';
import { Supplier } from '../../../services/inventory/types';
import SupplierForm from '../../../components/inventory/SupplierForm';
import LoadingState from '../../../components/LoadingState';
import ErrorAlert from '../../../components/ErrorAlert';
import BaseDashboard from '../BaseDashboard';

export default function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, filterStatus, suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await suppliersService.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    setFilteredSuppliers(filtered);
  };

  const handleCreateSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    await suppliersService.create(data);
    await loadSuppliers();
    setShowForm(false);
  };

  const handleUpdateSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSupplier) {
      await suppliersService.update(editingSupplier.id, data);
      await loadSuppliers();
      setShowForm(false);
      setEditingSupplier(undefined);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur?')) return;

    try {
      await suppliersService.delete(id);
      await loadSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert('Erreur lors de la suppression du fournisseur');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSupplier(undefined);
  };

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Fournisseurs">
        <LoadingState />
      </BaseDashboard>
    );
  }

  if (error) {
    return (
      <BaseDashboard title="Gestion des Fournisseurs">
        <ErrorAlert message={error} />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Fournisseurs">
      <div className="space-y-6">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Fournisseur
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun fournisseur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Fournisseur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Localisation
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{supplier.contactPerson}</td>
                    <td className="px-4 py-3 text-sm">{supplier.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      {supplier.city}, {supplier.country}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          supplier.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
          onClose={handleCloseForm}
        />
      )}
      </div>
    </BaseDashboard>
  );
}
