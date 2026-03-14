import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Plus, FileText, Trash2, Printer, ChevronLeft, Download, Loader2, Pencil, Search, AlertTriangle, RefreshCw, User, Lock, Shield, Eye, LogOut, Settings, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { Logo } from './components/Logo';
import { Invoice, InvoiceItem, Client } from './types';
import { numberToFrenchWords } from './utils/numberToWords';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Login Component
const Login: React.FC<{ 
  onLogin: (role: 'admin' | 'visitor', client?: Client) => void;
  adminPass: string;
}> = ({ onLogin, adminPass }) => {
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState<'admin' | 'visitor' | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      if (showLogin === 'admin') {
        if (password === adminPass) {
          onLogin('admin');
        } else {
          setError('Mot de passe incorrect');
        }
      } else if (showLogin === 'visitor') {
        if (!companyName || !password) {
          setError('Veuillez remplir tous les champs');
          setIsLoggingIn(false);
          return;
        }

        // Check if client exists
        const { data: client, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('name', companyName.trim())
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (client) {
          // Verify password
          if (client.password === password) {
            onLogin('visitor', client);
          } else {
            setError('Mot de passe incorrect pour cette entreprise');
          }
        } else {
          // First time login: Create account
          const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert([{ name: companyName.trim(), password }])
            .select()
            .single();

          if (createError) throw createError;
          onLogin('visitor', newClient);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err?.message?.includes('relation "clients" does not exist')) {
        setError("Erreur: La table 'clients' n'existe pas dans la base de données. Veuillez la créer.");
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={() => !isRevealed && setIsRevealed(true)}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 transition-all duration-500 ${!isRevealed ? 'py-16' : ''}`}
      >
        <div className="flex justify-center mb-8">
          <Logo className="w-48 sm:w-64" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Bienvenue</h2>

        {!isRevealed ? (
          <div className="text-center text-gray-400 text-sm animate-pulse mt-4">
            Cliquez pour continuer
          </div>
        ) : !showLogin ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setShowLogin('admin'); }}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-[#009FE3] hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-[#009FE3] rounded-xl group-hover:bg-[#009FE3] group-hover:text-white transition-colors">
                  <Shield size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Administrateur</p>
                  <p className="text-xs text-gray-500">Accès complet (Gestion)</p>
                </div>
              </div>
              <ChevronLeft className="rotate-180 text-gray-300" size={20} />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); setShowLogin('visitor'); }}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <User size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">Espace Client</p>
                  <p className="text-xs text-gray-500">Consultez vos documents</p>
                </div>
              </div>
              <ChevronLeft className="rotate-180 text-gray-300" size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleLogin} 
            className="space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {showLogin === 'visitor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Ma Société SARL"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
              {showLogin === 'visitor' && !error && (
                <p className="text-gray-400 text-[10px] mt-2 ml-1">
                  * Si c'est votre première visite, ce mot de passe sera enregistré.
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowLogin(null); setError(''); setPassword(''); setCompanyName(''); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Retour
              </button>
              <button 
                type="submit"
                disabled={isLoggingIn}
                className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 ${
                  showLogin === 'admin' 
                    ? 'bg-[#009FE3] hover:bg-[#0089C4] shadow-[#009FE3]/20' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Se connecter'}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  adminPass: string;
  visitorPass: string;
  onSave: (admin: string, visitor: string) => void;
}> = ({ isOpen, onClose, adminPass, visitorPass, onSave }) => {
  const [newAdminPass, setNewAdminPass] = useState(adminPass);
  const [newVisitorPass, setNewVisitorPass] = useState(visitorPass);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewAdminPass(adminPass);
      setNewVisitorPass(visitorPass);
    }
  }, [isOpen, adminPass, visitorPass]);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave(newAdminPass, newVisitorPass);
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#009FE3]/10 text-[#009FE3] rounded-lg">
                  <Settings size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Paramètres</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} /> Sécurité Admin
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Nouveau mot de passe Admin</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Mot de passe Admin"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={14} /> Sécurité Visiteur
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Nouveau mot de passe Visiteur</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text"
                      value={newVisitorPass}
                      onChange={(e) => setNewVisitorPass(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Laisser vide pour aucun mot de passe"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 ml-1 italic">* Si vide, le visiteur se connecte sans mot de passe.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !newAdminPass}
                className="flex-1 py-3 bg-[#009FE3] text-white rounded-xl font-bold hover:bg-[#0089C4] transition-colors shadow-lg shadow-[#009FE3]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Components
const InvoicePreview: React.FC<{ invoice: Invoice; onBack: () => void }> = ({ invoice, onBack }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = () => {
    // Native print dialog is the most reliable way to get a true vector PDF in the browser
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            .no-print {
              display: none !important;
            }
            .invoice-container {
              padding: 0 !important;
              margin: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              overflow: visible !important;
              background: white !important;
              display: block !important;
              box-shadow: none !important;
              border: none !important;
            }
            .invoice-container > div {
              width: 210mm !important;
              min-height: 297mm !important;
              height: auto !important;
              min-width: 210mm !important;
              padding: 15mm !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              flex-grow: 0 !important;
              transform: none !important;
              scale: 1 !important;
              margin-bottom: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
              color: black !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              border: 1px solid black !important;
              table-layout: fixed !important;
            }
            th, td {
              border: 1px solid black !important;
              padding: 6px 4px !important;
              word-wrap: break-word !important;
            }
            .no-print {
              display: none !important;
            }
            th:nth-child(1), td:nth-child(1) { width: 15mm !important; }
            th:nth-child(2), td:nth-child(2) { width: auto !important; }
            th:nth-child(3), td:nth-child(3) { width: 15mm !important; }
            th:nth-child(4), td:nth-child(4) { width: 30mm !important; }
            th:nth-child(5), td:nth-child(5) { width: 35mm !important; }
            thead { display: table-header-group !important; }
            tr { break-inside: avoid !important; }
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
          className="bg-white pt-8 px-8 sm:px-12 pb-8 shadow-2xl border border-gray-200 font-sans text-black flex flex-col flex-grow min-w-[800px] lg:min-w-0 min-h-[297mm] mx-auto origin-top sm:origin-center scale-[0.45] xs:scale-[0.6] sm:scale-100 mb-[-400px] xs:mb-[-250px] sm:mb-0"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Header */}
          <div className="mb-4">
            {/* Logo */}
            <div className="w-80">
              <Logo className="w-full" />
            </div>
          </div>

          {/* Document Title & Affaire & Client Info */}
          <div className="flex justify-between items-end mb-2">
            <div className="mb-2">
              {invoice.type === 'facture' ? (
                <h1 className="text-2xl font-bold text-gray-500 mb-2">Facture N° : {invoice.invoice_number}</h1>
              ) : (
                <div className="relative inline-block pr-8 mb-4">
                  {/* Curved brackets for Devis */}
                  <div className="absolute top-0 bottom-0 left-0 w-4 border-l-2 border-black rounded-l-3xl"></div>
                  <div className="absolute top-0 bottom-0 right-0 w-4 border-r-2 border-black rounded-r-3xl"></div>
                  <div className="px-6 py-2 text-sm">
                    <p className="font-bold">DEVIS N° {invoice.invoice_number}</p>
                    <p>Votre contact : ET-TAYEB ABDERRAHIM</p>
                    <p>Tél. : 06 61 86 82 38</p>
                    <p>E-mail : contact.ecoair@gmail.com</p>
                  </div>
                </div>
              )}
              <p className="text-sm font-bold">Affaire : . . . . . . . . . . . . . .</p>
            </div>

            {/* Client Info Box */}
            {invoice.type === 'facture' && (
              <div className="relative w-[360px] p-6 text-sm">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black"></div>
                
                <p className="text-gray-700 mb-2">A l'attent. de :</p>
                <table className="ml-4 text-sm w-full">
                  <tbody>
                    <tr>
                      <td className="py-0.5 text-gray-600 w-20">Sté:</td>
                      <td className="py-0.5 font-medium uppercase">{invoice.client_name}</td>
                    </tr>
                    {invoice.client_ice && (
                      <tr>
                        <td className="py-0.5 text-gray-600">ICE :</td>
                        <td className="py-0.5 font-medium">{invoice.client_ice}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-0.5 text-gray-600 align-top">Adresse:</td>
                      <td className="py-0.5 font-medium uppercase align-top">{invoice.client_address || 'CASABLANCA'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Table */}
          <table className="w-full border-collapse border border-black text-center text-sm mb-2">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black py-1 px-2 font-bold">Date :</th>
                <th className="border border-black py-1 px-2 font-bold">Bon de Commande</th>
                {invoice.type === 'facture' && (
                  <>
                    <th className="border border-black py-1 px-2 font-bold">Bon de Livraison</th>
                    <th className="border border-black py-1 px-2 font-bold">Mode de Règlement</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-1">{invoice.date.split('-').reverse().join('-')}</td>
                <td className="border border-black py-1 font-bold">. . .</td>
                {invoice.type === 'facture' && (
                  <>
                    <td className="border border-black py-1"></td>
                    <td className="border border-black py-1 font-bold uppercase">{invoice.mode_reglement}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>

          {/* Main Items Table */}
          <table className="w-full border-collapse mb-0 text-sm">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black py-1 px-2 w-16 text-center font-bold">Article</th>
                <th className="border border-black py-1 px-2 text-center font-bold">Désignation</th>
                <th className="border border-black py-1 px-2 w-12 text-center font-bold">Qté</th>
                <th className="border border-black py-1 px-2 w-24 text-center font-bold">Prix U. HT</th>
                <th className="border border-black py-1 px-2 w-28 text-center font-bold">Montant HT</th>
              </tr>
            </thead>
            <tbody>
                       {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border-x border-black p-2 align-top text-center">{idx + 1}</td>
                  <td className="border-x border-black p-2 align-top whitespace-pre-line">
                    {(() => {
                      const lines = item.description.split('\n');
                      const title = lines[0];
                      const details = lines.slice(1).join('\n');
                      return (
                        <>
                          {title && <div className={details ? "mb-1" : ""}>{title.startsWith('-') ? title : <span className="underline">{title}</span>}</div>}
                          {details && <div>{details}</div>}
                        </>
                      );
                    })()}
                  </td>
                  <td className="border-x border-black p-2 align-top text-center">{item.quantity}</td>
                  <td className="border-x border-black p-2 align-top text-right">{item.unit_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="border-x border-black p-2 align-top text-right font-bold">{item.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {/* Totals Rows integrated into main table */}
              <tr>
                <td colSpan={2} rowSpan={4} className="border-l border-b border-black pt-4 px-4 align-top text-left border-t-0 border-r-0">
                  {invoice.type === 'facture' ? (
                    <div className="text-sm">
                      <p className="mb-2 italic">Arrêtée la présente facture à la somme de :</p>
                      <p className="font-bold uppercase text-xs leading-relaxed break-words">{numberToFrenchWords(invoice.total_ttc)}</p>
                    </div>
                  ) : (
                    <div className="text-[10px] leading-tight text-gray-700">
                      <p className="font-bold italic mb-1">Remarque :</p>
                      <p className="mb-1">La commande n'est prise en compte que s'il y a un Bon de commande ou un cachet de la mention « Bon pour accord » sur le devis.</p>
                      <p>Tout travail effectué non mentionné sur le présent devis fera l'objet d'une facture séparée.</p>
                    </div>
                  )}
                </td>
                <td colSpan={2} className="border border-black py-1.5 px-3 text-center bg-gray-300 text-xs font-bold">Total H,T</td>
                <td className="border border-black py-1.5 px-3 text-right font-bold bg-white text-xs">{invoice.total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black py-1.5 px-3 text-center bg-gray-300 text-xs font-bold">T.V.A.%</td>
                <td className="border border-black py-1.5 px-3 text-right bg-white text-xs">{invoice.tva_rate}%</td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black py-1.5 px-3 text-center bg-gray-300 text-xs font-bold">MONTANT T.V.A.</td>
                <td className="border border-black py-1.5 px-3 text-right bg-white text-xs">{invoice.tva_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black py-1.5 px-3 text-center font-bold bg-gray-300 text-xs">TOTAL TTC</td>
                <td className="border border-black py-1.5 px-3 text-right font-bold bg-white text-xs">{invoice.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Section (Signature) */}
          <div className="flex justify-end">
            {invoice.type === 'facture' && (
              <div className="mt-4 font-bold text-center w-72 text-sm underline">DIRECTION GENERALE</div>
            )}
          </div>

          {/* Spacer to push footer to bottom */}
          <div className="flex-grow"></div>

          {/* Footer */}
          <div className="mt-auto pt-12 text-center text-xs">
            <p className="mb-2">RC: 490607 - Patente: 34101837 - I.F.: 48559866 - CNSS: 2432068 - ICE: 002711861000009</p>
            <p className="mb-2">26, AV MERS SULTAN, ETG 1, N°3, Casablanca</p>
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
          onClick={downloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#009FE3] text-white hover:bg-[#0089C4] transition-colors shadow-lg shadow-[#009FE3]/20 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Télécharger PDF
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-gray-500 no-print">
        Tip: Dans la fenêtre d'impression, assurez-vous que les "Graphiques d'arrière-plan" sont cochés et que les marges sont réglées sur "Aucune".
      </p>
    </div>
  );
};

const InvoiceForm: React.FC<{ 
  onSave: (invoice: Invoice) => void; 
  onCancel: () => void;
  initialData?: Invoice | null;
  mode: 'edit' | 'copy';
  clients: Client[];
}> = ({ onSave, onCancel, initialData, mode, clients }) => {
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
      invoice_number: `A${Math.floor(Math.random() * 1000)}/2026`,
      date: new Date().toISOString().split('T')[0],
      client_name: '',
      client_address: '',
      client_ice: '',
      mode_reglement: 'ESPECE',
      tva_rate: 20,
      items: [{ description: '', quantity: 1, unit_price: 0, total_ht: 0 }],
      client_id: ''
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
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client (Espace Client)</label>
            <select 
              value={formData.client_id}
              onChange={e => {
                const client = clients.find(c => c.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  client_id: e.target.value,
                  client_name: client ? client.name : formData.client_name 
                });
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none bg-white"
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Lier ce document à un compte client pour qu'il puisse le voir.</p>
          </div>
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

        <div className="flex flex-col sm:flex-row justify-end pt-6 border-t border-gray-100 gap-3 sm:gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all order-2 sm:order-1"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full sm:w-auto px-12 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {mode === 'edit' ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups ! Quelque chose s'est mal passé.</h1>
            <p className="text-gray-600 mb-6">L'application a rencontré une erreur inattendue.</p>
            <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-600">{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Actualiser la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [userRole, setUserRole] = useState<'admin' | 'visitor' | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('admin_pass') || 'admin123');
  const [visitorPassword, setVisitorPassword] = useState(() => localStorage.getItem('visitor_pass') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'preview'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [newClientPassword, setNewClientPassword] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({ isOpen: false, message: '', onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });
  const [editMode, setEditMode] = useState<'edit' | 'copy'>('copy');
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'facture' | 'devis' | 'clients'>('all');
  const [healthStatus, setHealthStatus] = useState<string>('checking...');
  const [dbConfigured, setDbConfigured] = useState(true);

  useEffect(() => {
    const checkConfig = () => {
      const url = (import.meta as any).env.VITE_SUPABASE_URL;
      const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      setDbConfigured(!!(url && key));
    };
    checkConfig();
    checkHealth();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchInvoices();
      if (userRole === 'admin') {
        fetchClients();
      }
    }
  }, [userRole, currentClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("Fetch clients error:", err);
    }
  };

  const checkHealth = async () => {
    setHealthStatus('Checking...');
    try {
      const { error } = await supabase.from('invoices').select('id').limit(1);
      if (!error) {
        setHealthStatus('Connected');
      } else {
        console.error("Health check error:", error);
        if (error.message === 'Supabase not configured') {
          setHealthStatus('Config manquante (Check Secrets)');
        } else if (error.message.includes('relation "invoices" does not exist')) {
          setHealthStatus('Tables non créées (SQL)');
        } else if (error.message.includes('JWT')) {
          setHealthStatus('Clé API invalide');
        } else {
          setHealthStatus(`Erreur: ${error.code || error.message}`);
        }
      }
    } catch (err: any) {
      console.error("Health check catch:", err);
      setHealthStatus(`Erreur: ${err.message || 'Connexion échouée'}`);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('invoices')
        .select('*, invoice_items(*)');

      if (userRole === 'visitor' && currentClient) {
        query = query.eq('client_id', currentClient.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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

  const handleLogin = (role: 'admin' | 'visitor', client?: Client) => {
    setUserRole(role);
    if (client) setCurrentClient(client);
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
            type: invoice.type,
            client_id: invoice.client_id || null
          })
          .eq('id', invoice.id);

        if (invError) throw invError;

        // Delete old items
        const { error: delError } = await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
        if (delError) throw delError;

        // Insert new items
        const itemsToInsert = (invoice.items || []).map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_ht: item.total_ht
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
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
            type: invoice.type,
            client_id: invoice.client_id || null
          }])
          .select()
          .single();

        if (invError) throw invError;
        if (!newInv) throw new Error("Erreur: Impossible de récupérer la nouvelle facture.");

        const itemsToInsert = (invoice.items || []).map(item => ({
          invoice_id: newInv.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_ht: item.total_ht
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }
      
      fetchInvoices();
      setView('list');
      setEditingInvoice(null);
    } catch (err: any) {
      console.error("Save error:", err);
      let errorMessage = "Erreur lors de l'enregistrement";
      
      if (err.message) {
        if (err.message.includes('UNIQUE constraint failed')) {
          errorMessage = "Erreur: Le numéro de facture existe déjà. (هذا الرقم موجود)";
        } else if (err.message === 'Supabase not configured') {
          errorMessage = "Erreur: Supabase n'est pas configuré. Veuillez ajouter les variables d'environnement.";
        } else if (err.message.includes('relation "invoices" does not exist')) {
          errorMessage = "Erreur: La table 'invoices' n'existe pas dans votre base de données Supabase.";
        } else {
          errorMessage = `Erreur: ${err.message}`;
        }
      }
      
      setAlertDialog({ isOpen: true, message: errorMessage });
    }
  };

  const deleteInvoice = async (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('invoices').delete().eq('id', id);
          if (error) throw error;
          fetchInvoices();
        } catch (err) {
          console.error("Delete error:", err);
        }
      }
    });
  };

  const deleteClient = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer ce client ? Toutes ses factures deviendront orphelines.',
      onConfirm: async () => {
        try {
          // For testing without Supabase configured
          if (!dbConfigured) {
            setClients(clients.filter(c => c.id !== id));
            setInvoices(invoices.map(inv => inv.client_id === id ? { ...inv, client_id: null } : inv));
            return;
          }

          // Set client_id to null for invoices associated with this client
          const { error: updateError } = await supabase.from('invoices').update({ client_id: null }).eq('client_id', id);
          if (updateError) throw updateError;
          
          const { error: deleteError } = await supabase.from('clients').delete().eq('id', id);
          if (deleteError) throw deleteError;
          
          fetchClients();
          fetchInvoices(); // Refresh invoices too since they might have changed
        } catch (err: any) {
          console.error("Delete client error:", err);
          setAlertDialog({ isOpen: true, message: `Erreur lors de la suppression du client: ${err.message || JSON.stringify(err)}` });
        }
      }
    });
  };

  const updateClientPassword = async (id: string, newPass: string) => {
    if (!newPass.trim()) return;
    try {
      // For testing without Supabase configured
      if (!dbConfigured) {
        setClients(clients.map(c => c.id === id ? { ...c, password: newPass.trim() } : c));
        setEditingClient(null);
        setNewClientPassword('');
        return;
      }

      const { error } = await supabase.from('clients').update({ password: newPass.trim() }).eq('id', id);
      if (error) throw error;
      fetchClients();
      setEditingClient(null);
      setNewClientPassword('');
    } catch (err: any) {
      console.error("Update password error:", err);
      setAlertDialog({ isOpen: true, message: `Erreur lors de la modification du mot de passe: ${err.message || JSON.stringify(err)}` });
    }
  };

  const handleSaveSettings = (admin: string, visitor: string) => {
    setAdminPassword(admin);
    setVisitorPassword(visitor);
    localStorage.setItem('admin_pass', admin);
    localStorage.setItem('visitor_pass', visitor);
  };

  if (!userRole) {
    return (
      <Login 
        onLogin={handleLogin} 
        adminPass={adminPassword} 
      />
    );
  }

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
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 no-print px-3 sm:px-6 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className="flex-shrink-0">
              <Logo className="w-24 sm:w-32" />
            </div>
            <div className="hidden xs:flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              {userRole === 'admin' ? (
                <Shield size={10} className="text-[#009FE3] sm:w-3 sm:h-3" />
              ) : (
                <Eye size={10} className="text-emerald-500 sm:w-3 sm:h-3" />
              )}
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-600">
                {userRole === 'admin' ? 'Admin' : 'Visiteur'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-4">
            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  setEditingInvoice(null);
                  setEditMode('copy');
                  setView('form');
                }}
                className="flex items-center gap-1.5 bg-[#009FE3] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#0089C4] transition-all shadow-lg shadow-[#009FE3]/20"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">Nouveau</span>
              </button>
            )}
            
            <div className="flex items-center gap-1 sm:gap-2">
              {userRole === 'admin' && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-gray-400 hover:text-[#009FE3] hover:bg-[#009FE3]/5 rounded-xl transition-all"
                  title="Paramètres"
                >
                  <Settings size={18} className="sm:w-5 sm:h-5" />
                </button>
              )}
              
              <button 
                onClick={() => setUserRole(null)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Déconnexion"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
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
                  
                  {healthStatus !== 'Connected' && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl max-w-2xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 mt-1 shrink-0" size={20} />
                        <div>
                          <h3 className="font-bold text-red-900">Problème de connexion à la base de données</h3>
                          <p className="text-sm text-red-700 mt-1">
                            L'application ne peut pas sauvegarder vos données. Raison : <span className="font-mono font-bold">{healthStatus}</span>
                          </p>
                          <div className="mt-3 text-xs text-red-600 space-y-1">
                            <p>• Vérifiez vos variables d'environnement <code className="bg-red-100 px-1 rounded">VITE_SUPABASE_URL</code> et <code className="bg-red-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.</p>
                            <p>• Assurez-vous d'avoir créé les tables <code className="bg-red-100 px-1 rounded">invoices</code> et <code className="bg-red-100 px-1 rounded">invoice_items</code> dans Supabase.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
                  <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
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
                    {userRole === 'admin' && (
                      <button
                        onClick={() => setActiveTab('clients')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'clients' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        Clients
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009FE3] focus:border-transparent outline-none shadow-sm transition-all text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full sm:w-auto shrink-0">
                      <div className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[80px]">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Factures</p>
                        <p className="text-xs sm:text-sm font-black text-[#009FE3]">
                          {invoices.filter(i => i.type === 'facture').reduce((sum, inv) => sum + inv.total_ttc, 0).toLocaleString()} <span className="text-[8px]">DH</span>
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[80px]">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Devis</p>
                        <p className="text-xs sm:text-sm font-black text-[#98C13C]">
                          {invoices.filter(i => i.type === 'devis').reduce((sum, inv) => sum + inv.total_ttc, 0).toLocaleString()} <span className="text-[8px]">DH</span>
                        </p>
                      </div>
                      <div className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-w-[60px]">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xs sm:text-sm font-black text-gray-900">{invoices.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009FE3]"></div>
                </div>
              ) : activeTab === 'clients' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                          <User size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{client.name}</h3>
                          <p className="text-xs text-gray-400">Inscrit le {new Date(client.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Documents:</span>
                          <span className="font-bold text-gray-900">{invoices.filter(i => i.client_id === client.id).length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Mot de passe:</span>
                          {editingClient === client.id ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="text"
                                value={newClientPassword}
                                onChange={(e) => setNewClientPassword(e.target.value)}
                                className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#009FE3] outline-none"
                              />
                              <button 
                                onClick={() => updateClientPassword(client.id, newClientPassword)}
                                className="p-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Enregistrer"
                              >
                                <Save size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingClient(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                title="Annuler"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">{client.password}</span>
                              <button 
                                onClick={() => {
                                  setEditingClient(client.id);
                                  setNewClientPassword(client.password);
                                }}
                                className="text-blue-400 hover:text-blue-600 transition-colors"
                                title="Modifier le mot de passe"
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button 
                          onClick={() => deleteClient(client.id)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {clients.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                      Aucun client inscrit pour le moment.
                    </div>
                  )}
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
                          {userRole === 'admin' ? (
                            <>
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
                            </>
                          ) : (
                            <div className="p-2 text-gray-300">
                              <Lock size={14} />
                            </div>
                          )}
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
              clients={clients}
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
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        adminPass={adminPassword}
        visitorPass={visitorPassword}
        onSave={handleSaveSettings}
      />

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

      {/* Confirm Dialog Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmation</h3>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                  className="px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-500/20"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Dialog Modal */}
      <AnimatePresence>
        {alertDialog.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Information</h3>
              <p className="text-gray-600 mb-6">{alertDialog.message}</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                  className="px-6 py-2 bg-[#009FE3] text-white font-medium hover:bg-[#0085C2] rounded-xl transition-colors shadow-sm shadow-[#009FE3]/20"
                >
                  OK
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
