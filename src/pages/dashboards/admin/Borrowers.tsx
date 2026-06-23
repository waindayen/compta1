import React, { useState, useEffect } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import BorrowerForm from '../../../components/loans/BorrowerForm';
import BorrowerList from '../../../components/loans/BorrowerList';
import LoadingState from '../../../components/LoadingState';
import {
  getAllBorrowers,
  createBorrower,
  updateBorrower,
  deleteBorrower,
  searchBorrowers,
  Borrower
} from '../../../services/loans';

export default function Borrowers() {
  const { currentUser: user } = useAuth();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [filteredBorrowers, setFilteredBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  useEffect(() => {
    loadBorrowers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      setFilteredBorrowers(borrowers);
    }
  }, [searchTerm, borrowers]);

  const loadBorrowers = async () => {
    try {
      setLoading(true);
      const data = await getAllBorrowers();
      setBorrowers(data);
      setFilteredBorrowers(data);
    } catch (error: any) {
      console.error('Error loading borrowers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setFilteredBorrowers(borrowers);
      return;
    }

    try {
      const results = await searchBorrowers(searchTerm);
      setFilteredBorrowers(results);
    } catch (error: any) {
      console.error('Error searching borrowers:', error);
    }
  };

  const handleCreate = async (data: Partial<Borrower>) => {
    if (!user) return;
    try {
      await createBorrower(data as any, user.uid);
      setShowForm(false);
      setSelectedBorrower(null);
      await loadBorrowers();
    } catch (error: any) {
      console.error('Error creating borrower:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: Partial<Borrower>) => {
    if (!selectedBorrower) return;
    try {
      await updateBorrower(selectedBorrower.id, data);
      setShowForm(false);
      setSelectedBorrower(null);
      await loadBorrowers();
    } catch (error: any) {
      console.error('Error updating borrower:', error);
      throw error;
    }
  };

  const handleDelete = async (borrower: Borrower) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${borrower.firstName} ${borrower.lastName}?`))
      return;

    try {
      await deleteBorrower(borrower.id);
      await loadBorrowers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (borrower: Borrower) => {
    setSelectedBorrower(borrower);
    setShowForm(true);
  };

  if (loading) {
    return <LoadingState message="Chargement des emprunteurs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emprunteurs</h1>
            <p className="text-sm text-gray-500">Gestion des emprunteurs</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedBorrower(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nouvel emprunteur
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, téléphone, email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <BorrowerList
          borrowers={filteredBorrowers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {showForm && (
        <BorrowerForm
          borrower={selectedBorrower}
          onSubmit={selectedBorrower ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setSelectedBorrower(null);
          }}
        />
      )}
    </div>
  );
}
