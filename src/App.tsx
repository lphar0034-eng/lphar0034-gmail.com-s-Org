import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Trash2, Printer, ChevronLeft, Download, Loader2, Pencil, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { Logo } from './components/Logo';
import { Invoice, InvoiceItem } from './types';
import { numberToFrenchWords } from './utils/numberToWords';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Components
const InvoicePreview: React.FC<{ invoice: Invoice; onBack: () => void }> = ({ invoice, onBack }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.invoice-container');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.display = 'block';
            (clonedElement as HTMLElement).style.boxShadow = 'none';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Ensure it fits on one page (A4 height is 297mm)
      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;
      let xOffset = 0;
      let yOffset = 0;

      if (finalHeight > 297) {
        const ratio = 297 / finalHeight;
        finalHeight = 297;
        finalWidth = finalWidth * ratio;
        xOffset = (pdfWidth - finalWidth) / 2;
      }

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Sanitize filename
      const prefix = invoice.type === 'devis' ? 'Devis' : 'Facture';
      const safeFileName = `${prefix}_${invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(safeFileName);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Erreur lors de la génération du PDF: ${error?.message || 'Erreur inconnue'}. Essayez d'utiliser le bouton "Imprimer" et choisissez "Enregistrer au format PDF".`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0; /* This removes browser headers/footers */
            }
            body {
              background: white;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
            .invoice-container {
              box-shadow: none !important;
              border: none !important;
              margin: 0 auto !important;
              padding: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              overflow: hidden !important;
              display: block !important;
            }
            .invoice-container > div {
              width: 210mm !important;
              min-width: 210mm !important;
              padding: 15mm !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              flex-grow: 0 !important;
            }
            .bg-gray-200 {
              background-color: #e5e7eb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="invoice-container overflow-x-auto pb-4"
      >
        <div 
          ref={invoiceRef}
          className="bg-white pt-4 px-4 sm:px-10 pb-6 shadow-2xl border border-gray-200 font-sans text-black flex flex-col flex-grow min-w-[800px] lg:min-w-0 mx-auto"
        >
        {/* Header with Logo and Client Box */}
        <div className="flex justify-between items-start mb-6">
          <Logo className="w-80 -mt-4" />
          <div className="text-left border-2 border-black p-4 rounded-none relative min-w-[320px] mt-12">
            <div className="absolute -top-3 left-6 bg-white px-2 font-bold italic text-sm">A l'attent . de :</div>
            <div className="space-y-2 text-xs pt-1">
              <p className="flex"><span className="font-bold w-16 underline">Sté:</span> <span className="flex-1 font-medium">{invoice.client_name}</span></p>
              <p className="flex"><span className="font-bold w-16 underline">Adresse :</span> <span className="flex-1 font-medium">{invoice.client_address || '................................................'}</span></p>
              <p className="flex"><span className="font-bold w-16 underline">ICE :</span> <span className="flex-1 font-medium">{invoice.client_ice || '................................................'}</span></p>
            </div>
            <div className="absolute -bottom-2.5 right-4 text-2xl font-serif leading-none">┘</div>
            <div className="absolute -top-2.5 right-4 text-2xl font-serif leading-none">┐</div>
            <div className="absolute -bottom-2.5 left-4 text-2xl font-serif leading-none">└</div>
            <div className="absolute -top-2.5 left-4 text-2xl font-serif leading-none">┌</div>
          </div>
        </div>

        {/* Invoice Number and Info Table */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-black mb-2">{invoice.type === 'devis' ? 'DEVIS' : 'Facture'} N° : {invoice.invoice_number}</h1>
          <p className="mb-2 font-bold text-sm">Affaire : ....................................................................................................................................................................</p>
          
          <table className="w-full border-collapse border-2 border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className={`border-2 border-black py-1 px-2 font-bold ${invoice.type === 'devis' ? 'w-1/2' : 'w-1/4'}`}>Date :</th>
                <th className={`border-2 border-black py-1 px-2 font-bold ${invoice.type === 'devis' ? 'w-1/2' : 'w-1/4'}`}>Bon de Commande</th>
                {invoice.type === 'facture' && (
                  <>
                    <th className="border-2 border-black py-1 px-2 font-bold w-1/4">Bon de Livraison</th>
                    <th className="border-2 border-black py-1 px-2 font-bold w-1/4">Mode de Règlement</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-2 border-black py-1.5">{invoice.date}</td>
                <td className="border-2 border-black py-1.5"></td>
                {invoice.type === 'facture' && (
                  <>
                    <td className="border-2 border-black py-1.5"></td>
                    <td className="border-2 border-black py-1.5 font-bold uppercase">{invoice.mode_reglement}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Items Table */}
        <table className="w-full border-collapse border-2 border-black mb-0 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border-2 border-black py-1 px-2 w-16 text-left">Article</th>
              <th className="border-2 border-black py-1 px-2 text-left">Désignation</th>
              <th className="border-2 border-black py-1 px-2 w-12">Qté</th>
              <th className="border-2 border-black py-1 px-2 w-24">Prix U. HT</th>
              <th className="border-2 border-black py-1 px-2 w-28">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-black/10">
                <td className="border-x-2 border-black p-2 align-top text-center font-medium"></td>
                <td className="border-x-2 border-black p-2 align-top whitespace-pre-line text-xs min-h-[100px]">
                  {(() => {
                    const lines = item.description.split('\n');
                    const title = lines[0];
                    const details = lines.slice(1).join('\n');
                    return (
                      <>
                        <div className="font-bold underline mb-2 uppercase">{title}</div>
                        <div className="font-medium">{details}</div>
                      </>
                    );
                  })()}
                </td>
                <td className="border-x-2 border-black p-2 align-top text-center font-medium">{item.quantity}</td>
                <td className="border-x-2 border-black p-2 align-top text-right font-medium">{item.unit_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td className="border-x-2 border-black p-2 align-top text-right font-bold">{item.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {/* Fill remaining space to match the photo's look */}
            <tr style={{ height: `${Math.max(20, 250 - (invoice.items.length * 45))}px` }}>
              <td className="border-x-2 border-black"></td>
              <td className="border-x-2 border-black"></td>
              <td className="border-x-2 border-black"></td>
              <td className="border-x-2 border-black"></td>
              <td className="border-x-2 border-black"></td>
            </tr>
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-4">
          <table className="w-[280px] border-collapse border-2 border-black text-xs">
            <tbody>
              <tr className="bg-gray-200">
                <td className="border-2 border-black px-2 py-1 font-bold">Total H.T</td>
                <td className="border-2 border-black px-2 py-1 text-right font-bold">{invoice.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
              <tr>
                <td className="border-2 border-black px-2 py-1 font-bold italic">T.V.A.%</td>
                <td className="border-2 border-black px-2 py-1 text-right font-bold">{invoice.tva_rate}%</td>
              </tr>
              <tr>
                <td className="border-2 border-black px-2 py-1 font-bold italic">MONTANT T.V.A.</td>
                <td className="border-2 border-black px-2 py-1 text-right font-bold">{invoice.tva_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
              <tr className="bg-gray-200">
                <td className="border-2 border-black px-2 py-1 font-bold text-sm">TOTAL TTC</td>
                <td className="border-2 border-black px-2 py-1 text-right font-bold text-sm">{invoice.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        {invoice.type === 'facture' && (
          <div className="mb-6 text-xs">
            <p className="italic mb-0.5">Arrêtée la présente facture à la somme de :</p>
            <p className="font-bold uppercase tracking-tight leading-tight">
              {numberToFrenchWords(invoice.total_ttc)}
            </p>
          </div>
        )}

        {/* Signature Area */}
        {invoice.type === 'facture' && (
          <div className="text-right mb-20 mt-auto">
            <p className="font-bold text-base mr-12">DIRECTION GENERALE</p>
          </div>
        )}

        {invoice.type === 'devis' && <div className="mt-auto mb-10"></div>}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-[9px] text-center space-y-0.5 mt-4">
          <p className="font-bold">RC: 490607 - Patente: 34101837 - I.F.: 48559866 - CNSS: 2432068 - ICE: 002711861000009</p>
          <p>26, AV MERS SULTAN, ETG 1, N°3, Casablanca</p>
          <p>Tél.: 06 62 22 84 21 / 06 61 96 57 05/ - E-mail : contact.ecoair@gmail.com</p>
        </div>
      </div>
    </motion.div>

      <div className="mt-8 flex flex-wrap justify-center gap-4 no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={18} /> Retour
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-gray-800 text-white hover:bg-gray-900 transition-colors"
        >
          <Printer size={18} /> Imprimer
        </button>
        <button 
          onClick={downloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#009FE3] text-white hover:bg-[#0089C4] transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Télécharger PDF
        </button>
      </div>
    </div>
  );
};

const InvoiceForm: React.FC<{ 
  onSave: (invoice: Invoice) => void; 
  onCancel: () => void;
  initialData?: Invoice | null;
  mode: 'edit' | 'copy';
}> = ({ onSave, onCancel, initialData, mode }) => {
  const [formData, setFormData] = useState<Partial<Invoice>>(() => {
    if (initialData) {
      if (mode === 'copy') {
        const { id, created_at, ...dataWithoutId } = initialData as any;
        return {
          ...dataWithoutId,
          invoice_number: `${dataWithoutId.invoice_number}-COPIE`
        };
      }
      return initialData;
    }
    return {
      type: 'facture',
      invoice_number: `A${Math.floor(Math.random() * 1000)}/2024`,
      date: new Date().toISOString().split('T')[0],
      client_name: '',
      client_address: '',
      client_ice: '',
      mode_reglement: 'ESPECE',
      tva_rate: 20,
      items: [{ description: '', quantity: 1, unit_price: 0, total_ht: 0 }]
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  // If initialData changes, update form
  useEffect(() => {
    if (initialData) {
      if (mode === 'copy') {
        const { id, created_at, ...dataWithoutId } = initialData as any;
        setFormData({
          ...dataWithoutId,
          invoice_number: `${dataWithoutId.invoice_number}-COPIE`
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [initialData, mode]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...(formData.items || []), { description: '', quantity: 1, unit_price: 0, total_ht: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_ht = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const total_ht = (formData.items || []).reduce((sum, item) => sum + item.total_ht, 0);
    const tva_amount = total_ht * ((formData.tva_rate || 20) / 100);
    const total_ttc = total_ht + tva_amount;
    return { total_ht, tva_amount, total_ttc };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const totals = calculateTotals();
      await onSave({ ...formData, ...totals } as Invoice);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl mx-auto border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-8">
        {mode === 'edit' ? `Modifier le ${formData.type === 'devis' ? 'Devis' : 'Facture'}` : mode === 'copy' ? `Copier le ${formData.type === 'devis' ? 'Devis' : 'Facture'}` : `Nouveau ${formData.type === 'devis' ? 'Devis' : 'Facture'}`}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'facture' })}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.type === 'facture' ? 'bg-[#009FE3] text-white shadow-lg shadow-[#009FE3]/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            FACTURE
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'devis' })}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.type === 'devis' ? 'bg-[#98C13C] text-white shadow-lg shadow-[#98C13C]/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            DEVIS
          </button>
        </div>

        <div className={`grid grid-cols-1 ${formData.type === 'facture' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° {formData.type === 'facture' ? 'Facture' : 'Devis'}</label>
            <input 
              type="text" 
              value={formData.invoice_number} 
              onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              value={formData.date} 
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none"
              required
            />
          </div>
          {formData.type === 'facture' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Règlement</label>
              <select 
                value={formData.mode_reglement} 
                onChange={e => setFormData({ ...formData, mode_reglement: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none"
              >
                <option value="ESPECE">ESPECE</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="VIREMENT">VIREMENT</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              placeholder="Nom du client / Société" 
              value={formData.client_name}
              onChange={e => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none"
              required
            />
            <input 
              placeholder="ICE du client" 
              value={formData.client_ice}
              onChange={e => setFormData({ ...formData, client_ice: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none"
            />
            <textarea 
              placeholder="Adresse du client" 
              value={formData.client_address}
              onChange={e => setFormData({ ...formData, client_address: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none md:col-span-2"
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-700">Articles / Services</h3>
            <button 
              type="button" 
              onClick={addItem}
              className="w-full sm:w-auto px-4 py-2 bg-[#009FE3]/10 text-[#009FE3] rounded-lg text-sm font-bold hover:bg-[#009FE3]/20 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus size={16} /> Ajouter un article
            </button>
          </div>
          
          <div className="space-y-6 sm:space-y-3">
            {formData.items?.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 p-4 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl sm:rounded-none relative">
                <div className="sm:col-span-6">
                  <label className="block sm:hidden text-xs font-bold text-gray-400 uppercase mb-1">Désignation</label>
                  <textarea 
                    placeholder="Désignation (1er ligne = Titre Gras/Souligné)" 
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none min-h-[80px]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 sm:contents gap-3">
                  <div className="sm:col-span-2">
                    <label className="block sm:hidden text-xs font-bold text-gray-400 uppercase mb-1">Qté</label>
                    <input 
                      type="number" 
                      placeholder="Qté" 
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none text-center"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block sm:hidden text-xs font-bold text-gray-400 uppercase mb-1">Prix U. HT</label>
                    <input 
                      type="number" 
                      placeholder="Prix U. HT" 
                      value={item.unit_price}
                      onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none text-right"
                      required
                    />
                  </div>
                </div>
                <div className="absolute top-2 right-2 sm:static sm:col-span-1 flex justify-center items-center">
                  <button 
                    type="button" 
                    onClick={() => removeItem(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end pt-6 border-t border-gray-100 gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#98C13C] text-white font-bold hover:bg-[#86AB34] transition-colors shadow-lg shadow-[#98C13C]/20 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            {mode === 'edit' ? 'Mettre à jour' : `Enregistrer la ${formData.type === 'devis' ? 'Devis' : 'Facture'}`}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'preview'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'copy'>('copy');
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'facture' | 'devis'>('all');
  const [healthStatus, setHealthStatus] = useState<string>('checking...');

  useEffect(() => {
    fetchInvoices();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const { data, error } = await supabase.from('invoices').select('id', { count: 'exact', head: true });
      if (!error) {
        setHealthStatus('Connected');
      } else {
        setHealthStatus('Supabase Error');
      }
    } catch (err) {
      setHealthStatus('Failed to connect');
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvoices = (data || []).map((inv: any) => ({
        ...inv,
        items: inv.invoice_items
      }));
      setInvoices(formattedInvoices);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveInvoice = async (invoice: Invoice) => {
    try {
      const isUpdate = editMode === 'edit' && invoice.id;
      
      if (isUpdate) {
        // Update invoice
        const { error: invError } = await supabase
          .from('invoices')
          .update({
            invoice_number: invoice.invoice_number,
            date: invoice.date,
            client_name: invoice.client_name,
            client_address: invoice.client_address,
            client_ice: invoice.client_ice,
            mode_reglement: invoice.mode_reglement,
            total_ht: invoice.total_ht,
            tva_rate: invoice.tva_rate,
            tva_amount: invoice.tva_amount,
            total_ttc: invoice.total_ttc,
            type: invoice.type
          })
          .eq('id', invoice.id);

        if (invError) throw invError;

        // Delete old items
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);

        // Insert new items
        const itemsToInsert = (invoice.items || []).map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_ht: item.total_ht
        }));

        await supabase.from('invoice_items').insert(itemsToInsert);
      } else {
        // Create new invoice
        const { data: newInv, error: invError } = await supabase
          .from('invoices')
          .insert([{
            invoice_number: invoice.invoice_number,
            date: invoice.date,
            client_name: invoice.client_name,
            client_address: invoice.client_address,
            client_ice: invoice.client_ice,
            mode_reglement: invoice.mode_reglement,
            total_ht: invoice.total_ht,
            tva_rate: invoice.tva_rate,
            tva_amount: invoice.tva_amount,
            total_ttc: invoice.total_ttc,
            type: invoice.type
          }])
          .select()
          .single();

        if (invError) throw invError;

        const itemsToInsert = (invoice.items || []).map(item => ({
          invoice_id: newInv.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_ht: item.total_ht
        }));

        await supabase.from('invoice_items').insert(itemsToInsert);
      }
      
      fetchInvoices();
      setView('list');
      setEditingInvoice(null);
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        alert("Erreur: Le numéro de facture existe déjà. (هذا الرقم موجود)");
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    }
  };

  const deleteInvoice = async (id: string | number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      fetchInvoices();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-[#009FE3]/20">
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @media (max-width: 640px) {
            .mobile-full-width {
              width: 100% !important;
            }
          }
        `}
      </style>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="scale-75 origin-left" />
            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">v2.1-supabase</span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${healthStatus === 'Connected' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {healthStatus}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setEditingInvoice(null);
                setEditMode('copy');
                setView('form');
              }}
              className="flex items-center gap-2 bg-[#009FE3] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold hover:bg-[#0089C4] transition-all shadow-lg shadow-[#009FE3]/20"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tableau de Bord</h1>
                  <p className="text-gray-500 mt-2">Gérez vos factures et réparations en toute simplicité.</p>
                </div>
                <div className="flex flex-col lg:flex-row items-center gap-6 w-full lg:w-auto">
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Tout
                    </button>
                    <button
                      onClick={() => setActiveTab('facture')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'facture' ? 'bg-[#009FE3] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Factures
                    </button>
                    <button
                      onClick={() => setActiveTab('devis')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'devis' ? 'bg-[#98C13C] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Devis
                    </button>
                  </div>
                  <div className="relative w-full lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Rechercher un client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none shadow-sm transition-all"
                    />
                  </div>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-6 sm:gap-8 text-center sm:text-right w-full lg:w-auto shrink-0">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Factures</p>
                        <p className="text-xl font-black text-[#009FE3]">
                          {invoices.filter(i => i.type === 'facture').reduce((sum, inv) => sum + inv.total_ttc, 0).toLocaleString()} <span className="text-xs">DH</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Devis</p>
                        <p className="text-xl font-black text-[#98C13C]">
                          {invoices.filter(i => i.type === 'devis').reduce((sum, inv) => sum + inv.total_ttc, 0).toLocaleString()} <span className="text-xs">DH</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documents</p>
                        <p className="text-xl font-black text-gray-900">{invoices.length}</p>
                      </div>
                    </div>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009FE3]"></div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="text-gray-300" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Aucun document trouvé</h3>
                  <p className="text-gray-500 mt-2 mb-8">Commencez par créer votre premier document (Facture ou Devis).</p>
                  <button 
                    onClick={() => setView('form')}
                    className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
                  >
                    Créer un document
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invoices
                    .filter(inv => {
                      const matchesSearch = inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesTab = activeTab === 'all' || inv.type === activeTab;
                      return matchesSearch && matchesTab;
                    })
                    .map((invoice) => (
                    <motion.div 
                      key={invoice.id}
                      layoutId={`invoice-${invoice.id}`}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${invoice.type === 'devis' ? 'bg-[#98C13C]/10 text-[#86AB34]' : 'bg-[#009FE3]/10 text-[#0089C4]'}`}>
                          {invoice.type === 'devis' ? 'Devis' : 'Facture'} {invoice.invoice_number}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingInvoice(invoice);
                              setShowChoiceModal(true);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-50 rounded-full transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteInvoice(invoice.id!);
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{invoice.client_name}</h3>
                      <p className="text-sm text-gray-400 mb-6">{invoice.date}</p>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Montant TTC</p>
                          <p className="text-2xl font-black text-gray-900">{invoice.total_ttc.toLocaleString()} <span className="text-sm">DH</span></p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setView('preview');
                          }}
                          className="bg-gray-50 text-gray-900 p-3 rounded-xl hover:bg-[#009FE3] hover:text-white transition-all"
                        >
                          <Printer size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'form' && (
            <InvoiceForm 
              key="form"
              initialData={editingInvoice}
              mode={editMode}
              onSave={saveInvoice} 
              onCancel={() => {
                setView('list');
                setEditingInvoice(null);
              }} 
            />
          )}

          {view === 'preview' && selectedInvoice && (
            <InvoicePreview 
              key="preview"
              invoice={selectedInvoice} 
              onBack={() => setView('list')} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Choice Modal */}
      <AnimatePresence>
        {showChoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Modifier le document</h3>
              <p className="text-gray-500 mb-8">Voulez-vous modifier l'original ou créer un nouveau document à partir de celui-ci ?</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setEditMode('edit');
                    setShowChoiceModal(false);
                    setView('form');
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-[#009FE3] text-white font-bold hover:bg-[#0089C4] transition-all flex items-center justify-between group"
                >
                  <span>Modifier l'original</span>
                  <Pencil size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
                
                <button 
                  onClick={() => {
                    setEditMode('copy');
                    setShowChoiceModal(false);
                    setView('form');
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-all flex items-center justify-between group"
                >
                  <span>Créer une copie (Nouveau)</span>
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
                
                <button 
                  onClick={() => setShowChoiceModal(false)}
                  className="w-full py-3 text-gray-400 font-medium hover:text-gray-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
          .shadow-2xl, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          .rounded-xl, .rounded-2xl { border-radius: 0 !important; }
          .border { border: none !important; }
        }
      `}</style>
    </div>
  );
}
