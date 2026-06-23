import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';
import { ContactService, ContactConfig } from '../../services/contact';

interface ContactFormProps {
  onClose?: () => void;
}

const DEFAULT_CONFIG: ContactConfig = {
  whatsappNumber: '+33612345678',
  businessHours: {
    start: '09:00',
    end: '18:00'
  },
  bannerText: {
    title: 'Besoin d\'aide ?',
    subtitle: 'Notre équipe est là pour vous',
    description: 'Contactez-nous directement via WhatsApp pour une réponse rapide'
  },
  isEnabled: true
};

export default function ContactForm({ onClose }: ContactFormProps) {
  const [config, setConfig] = useState<ContactConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await ContactService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error loading contact config:', err);
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getWhatsAppMessage = () => {
    return `Bonjour, je suis ${formData.name || '[Votre nom]'}. ${formData.subject ? `Sujet: ${formData.subject}.` : ''} ${formData.message || '[Votre message]'}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const isAvailable = ContactService.isWithinBusinessHours(config);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">{config.bannerText.title}</h3>
        <p className="text-sm text-blue-800 mb-2">{config.bannerText.subtitle}</p>
        <p className="text-sm text-blue-700">
          {isAvailable ? (
            <>Notre équipe est disponible de {config.businessHours.start} à {config.businessHours.end} au {config.whatsappNumber}</>
          ) : (
            <>Nous sommes actuellement fermés. Nos horaires: {config.businessHours.start} - {config.businessHours.end}</>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Votre nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Comment souhaitez-vous être appelé ?"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Quel est le sujet de votre message ?"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Comment pouvons-nous vous aider ?"
          />
        </div>

        <WhatsAppButton 
          phoneNumber={config.whatsappNumber}
          message={getWhatsAppMessage()}
          disabled={!isAvailable}
        />

        {!isAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              Notre service client est actuellement fermé. Nous vous répondrons dès notre réouverture.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}