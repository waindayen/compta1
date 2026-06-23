import React from 'react';

export default function FAQ() {
  const faqs = [
    {
      question: "Comment créer un compte ?",
      answer: "Pour créer un compte, cliquez sur le bouton 'S'inscrire' et suivez les étapes. Vous devrez fournir quelques informations de base et vérifier votre identité."
    },
    {
      question: "Comment effectuer un pari ?",
      answer: "Sélectionnez un match, choisissez votre type de pari, entrez votre mise dans le coupon de paris et confirmez votre pari."
    },
    {
      question: "Comment retirer mes gains ?",
      answer: "Accédez à votre portefeuille, sélectionnez 'Retrait', choisissez votre méthode de paiement préférée et suivez les instructions."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Questions fréquentes</h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{faq.question}</h2>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}