export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_ht: number;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  date: string;
  client_name: string;
  client_address: string;
  client_ice: string;
  mode_reglement: string;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  type: 'facture' | 'devis';
  items: InvoiceItem[];
}
