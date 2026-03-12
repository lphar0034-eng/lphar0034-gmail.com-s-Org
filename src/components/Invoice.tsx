import React from 'react';
import { Logo } from './Logo';

interface InvoiceItem {
  article?: string;
  designation: string;
  qty: number;
  price: number;
}

export const Invoice: React.FC = () => {
  const items: InvoiceItem[] = [
    {
      designation: "-Réparation des plaque électrique (Résidence Universitaire Mohammadia)\n\n-réparation des plaque électrique 4 feux, changement priez et câble d'alimentation (3*2,5 min), changement commutateur et ponton.",
      qty: 35,
      price: 350.00
    }
  ];

  const totalHT = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const tvaRate = 0.20;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;

  return (
    <div className="bg-white p-8 max-w-[800px] mx-auto shadow-lg border border-gray-200 my-10 font-sans text-sm text-black">
      {/* Header with Logo */}
      <div className="flex justify-between items-start mb-8">
        <Logo className="w-64" />
        <div className="text-right border-2 border-black p-4 rounded-lg relative min-w-[250px]">
          <div className="absolute -top-3 left-4 bg-white px-2 font-bold italic">A l'attent . de :</div>
          <div className="space-y-1 text-left mt-2">
            <p><span className="font-bold underline">Sté:</span> Résidences Universitaires</p>
            <p><span className="font-bold underline">Adresse :</span> Casablanca</p>
            <p><span className="font-bold underline">ICE :</span> 001740003000026</p>
          </div>
        </div>
      </div>

      {/* Invoice Number and Date Table */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-600 mb-4">Facture N° : A01/2024</h1>
        <p className="mb-4 font-bold">Affaire : . . . . . . . . . . . . . .</p>
        
        <table className="w-full border-collapse border-2 border-black text-center">
          <thead>
            <tr className="bg-gray-300">
              <th className="border-2 border-black py-1 px-2">Date :</th>
              <th className="border-2 border-black py-1 px-2">Bon de Commande</th>
              <th className="border-2 border-black py-1 px-2">Bon de Livraison</th>
              <th className="border-2 border-black py-1 px-2">Mode de Règlement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-2 border-black py-2">08/01/2024</td>
              <td className="border-2 border-black py-2"></td>
              <td className="border-2 border-black py-2"></td>
              <td className="border-2 border-black py-2 font-bold">CHEQUE</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main Items Table */}
      <table className="w-full border-collapse border-2 border-black mb-4">
        <thead>
          <tr className="bg-gray-300">
            <th className="border-2 border-black py-1 px-2 w-16 text-left">Article</th>
            <th className="border-2 border-black py-1 px-2 text-left">Désignation</th>
            <th className="border-2 border-black py-1 px-2 w-12">Qté</th>
            <th className="border-2 border-black py-1 px-2 w-24">Prix U. HT</th>
            <th className="border-2 border-black py-1 px-2 w-28">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="min-h-[400px]">
              <td className="border-x-2 border-black p-2 align-top"></td>
              <td className="border-x-2 border-black p-2 align-top whitespace-pre-line font-bold">
                {item.designation}
              </td>
              <td className="border-x-2 border-black p-2 align-top text-center">{item.qty}</td>
              <td className="border-x-2 border-black p-2 align-top text-center">{item.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
              <td className="border-x-2 border-black p-2 align-top text-right font-bold">{(item.qty * item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
          {/* Empty space to match the height in the photo */}
          <tr style={{ height: '300px' }}>
            <td className="border-x-2 border-black"></td>
            <td className="border-x-2 border-black"></td>
            <td className="border-x-2 border-black"></td>
            <td className="border-x-2 border-black"></td>
            <td className="border-x-2 border-black"></td>
          </tr>
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <table className="w-1/3 border-collapse border-2 border-black">
          <tbody>
            <tr className="bg-gray-300">
              <td className="border-2 border-black px-2 py-1 font-bold">Total H,T</td>
              <td className="border-2 border-black px-2 py-1 text-right font-bold">{totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
            </tr>
            <tr>
              <td className="border-2 border-black px-2 py-1 font-bold italic">T.V.A.%</td>
              <td className="border-2 border-black px-2 py-1 text-right">20%</td>
            </tr>
            <tr className="bg-gray-300">
              <td className="border-2 border-black px-2 py-1 font-bold">MONTANT T.V.A.</td>
              <td className="border-2 border-black px-2 py-1 text-right font-bold">{tvaAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
            </tr>
            <tr className="bg-gray-300">
              <td className="border-2 border-black px-2 py-1 font-bold">TOTAL TTC</td>
              <td className="border-2 border-black px-2 py-1 text-right font-bold">{totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in words */}
      <div className="mb-12">
        <p className="italic mb-2">Arrêtée la présente facture à la somme de :</p>
        <p className="font-bold uppercase">QUATORZE MILLE SEPT CENTS DIRHAMS, 00 CTS</p>
      </div>

      {/* Signature Area */}
      <div className="text-right mb-16">
        <p className="font-bold text-lg mr-12">DIRECTION GENERALE</p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 text-[10px] text-center space-y-1">
        <p className="font-bold">RC: 490607 - Patente: 34101837 - I.F.: 48559866 - CNSS: 2432068 - ICE: 002711861000009</p>
        <p>26, AV MERS SULTAN, ETG 1, N°3, Casablanca</p>
        <p>Tél.: 06 62 22 84 21 / 06 61 96 57 05/ - E-mail : contact.ecoair@gmail.com</p>
      </div>
    </div>
  );
};
