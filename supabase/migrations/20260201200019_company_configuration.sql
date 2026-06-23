/*
  # Configuration de l'Entreprise et des Déductions

  1. Nouvelles Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `manager_id` (uuid, référence vers auth.users)
      - `company_name` (text)
      - `company_address` (text)
      - `company_phone` (text)
      - `company_email` (text)
      - `company_logo_url` (text, optionnel)
      - `tax_rate` (numeric, taux d'imposition en pourcentage)
      - `social_security_rate` (numeric, taux de sécurité sociale en pourcentage)
      - `insurance_rate` (numeric, taux d'assurance en pourcentage)
      - `other_deduction_rate` (numeric, autres déductions en pourcentage)
      - `other_deduction_name` (text, nom de la déduction supplémentaire)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `company_settings`
    - Policies pour que les managers ne puissent voir/modifier que leurs propres configurations
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT 'Votre Entreprise',
  company_address text NOT NULL DEFAULT '123 Rue Example, Ville',
  company_phone text NOT NULL DEFAULT '+225 XX XX XX XX XX',
  company_email text NOT NULL DEFAULT 'contact@entreprise.com',
  company_logo_url text,
  tax_rate numeric NOT NULL DEFAULT 15.0,
  social_security_rate numeric NOT NULL DEFAULT 5.0,
  insurance_rate numeric NOT NULL DEFAULT 2.0,
  other_deduction_rate numeric DEFAULT 0.0,
  other_deduction_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(manager_id)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view own company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert own company settings"
  ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update own company settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete own company settings"
  ON company_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE INDEX IF NOT EXISTS idx_company_settings_manager_id ON company_settings(manager_id);