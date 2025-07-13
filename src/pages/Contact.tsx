import React from 'react';

const Contact = () => {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="prose prose-invert max-w-xl text-slate-300">
        <h1 className="text-3xl font-bold text-white mb-6">📬 Contact Us</h1>
        <p className="mb-4">You may contact us using the information below:</p>
        <ul className="space-y-2">
          <li>🏢 <span className="font-semibold text-white">Merchant Legal Entity Name:</span> SARFARAZ ALAM</li>
          <li>📍 <span className="font-semibold text-white">Registered Address:</span> Chhota Mahagama, Sahibganj, Sahibganj, Jharkhand, PIN: 816110</li>
          <li>🏬 <span className="font-semibold text-white">Operational Address:</span> Chhota Mahagama, Sahibganj, Sahibganj, Jharkhand, PIN: 816110</li>
          <li>📧 <span className="font-semibold text-white">E-mail ID:</span> <a href="mailto:support@mypnl.pro" className="text-blue-400 hover:underline">support@mypnl.pro</a></li>
        </ul>
      </div>
    </main>
  );
};

export default Contact;
