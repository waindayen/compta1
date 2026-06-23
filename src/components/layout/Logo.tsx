import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="bg-blue-600 p-2 rounded-lg">
        <Trophy className="w-6 h-6 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gray-900">Ndex36</span>
        <span className="text-xs text-gray-500">Paris Sportifs</span>
      </div>
    </Link>
  );
}