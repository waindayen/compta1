import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  disabled?: boolean;
}

export default function WhatsAppButton({ phoneNumber, message = '', disabled = false }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    if (disabled) return;
    
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${
        disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-600 text-white'
      }`}
    >
      <MessageCircle className="w-5 h-5" />
      <span>Contacter par WhatsApp</span>
    </button>
  );
}