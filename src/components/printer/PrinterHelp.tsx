import React from 'react';
import { HelpCircle, Bluetooth, Smartphone, Printer, Check, Settings, AlertCircle } from 'lucide-react';

export default function PrinterHelp() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <HelpCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Aide à la configuration de l'imprimante</h2>
          <p className="text-sm text-gray-600">
            Guide pour configurer votre imprimante thermique Bluetooth
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Prérequis</h3>
          
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Bluetooth className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Bluetooth activé</p>
              <p className="text-sm text-gray-600">
                Assurez-vous que le Bluetooth de votre appareil est activé et que l'imprimante est allumée.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Appairage Bluetooth</p>
              <p className="text-sm text-gray-600">
                Avant d'utiliser l'application, vous devez appairer votre imprimante avec votre appareil dans les paramètres Bluetooth de votre téléphone.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Printer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Imprimantes compatibles</p>
              <p className="text-sm text-gray-600">
                Cette application est compatible avec les imprimantes thermiques Bluetooth 58mm et 80mm qui supportent les protocoles ESC/POS ou TSPL.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Protocole d'impression</p>
              <p className="text-sm text-gray-600">
                Sélectionnez le bon protocole pour votre imprimante:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• ESC/POS: Pour la plupart des imprimantes thermiques de tickets</li>
                <li>• TSPL: Pour les imprimantes d'étiquettes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-lg">Étapes de configuration</h3>
          
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium">Activer l'impression</p>
                <p className="text-sm text-gray-600">
                  Activez l'option "Activer l'impression" pour permettre l'impression des tickets.
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium">Sélectionner le protocole</p>
                <p className="text-sm text-gray-600">
                  Choisissez le protocole d'impression adapté à votre imprimante (ESC/POS pour les imprimantes de tickets, TSPL pour les imprimantes d'étiquettes).
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium">Rechercher des imprimantes</p>
                <p className="text-sm text-gray-600">
                  Cliquez sur "Rechercher" pour trouver les imprimantes Bluetooth disponibles. Assurez-vous que votre imprimante est allumée et en mode découvrable.
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">4</div>
              <div>
                <p className="font-medium">Sélectionner votre imprimante</p>
                <p className="text-sm text-gray-600">
                  Cliquez sur l'imprimante que vous souhaitez utiliser dans la liste des imprimantes disponibles.
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">5</div>
              <div>
                <p className="font-medium">Sélectionner la largeur du papier</p>
                <p className="text-sm text-gray-600">
                  Choisissez la largeur du papier de votre imprimante (58mm ou 80mm).
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">6</div>
              <div>
                <p className="font-medium">Sauvegarder la configuration</p>
                <p className="text-sm text-gray-600">
                  Cliquez sur "Sauvegarder" pour enregistrer votre configuration.
                </p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex-shrink-0 mt-0.5">7</div>
              <div>
                <p className="font-medium">Tester l'impression</p>
                <p className="text-sm text-gray-600">
                  Utilisez la fonction "Imprimer une page de test" pour vérifier que votre imprimante fonctionne correctement.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Impression automatique</p>
              <p className="text-sm text-blue-700">
                Une fois configurée, l'imprimante imprimera automatiquement les tickets lors de leur création ou lors de la visualisation d'un ticket.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Problèmes de connexion?</p>
              <p className="text-sm text-yellow-700">
                Si vous rencontrez des problèmes de connexion, essayez de:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                <li>• Redémarrer votre imprimante</li>
                <li>• Désactiver puis réactiver le Bluetooth</li>
                <li>• Vérifier que l'imprimante est chargée</li>
                <li>• Essayer un protocole d'impression différent</li>
                <li>• Supprimer et réappairer l'imprimante dans les paramètres Bluetooth</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}