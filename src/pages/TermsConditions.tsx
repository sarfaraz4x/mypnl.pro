import React from 'react';

const TermsConditions = () => {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="prose prose-invert max-w-2xl text-slate-300">
        <h1 className="text-3xl font-bold text-white mb-6">📜 Terms and Conditions</h1>

        <h2 className="text-2xl font-semibold text-white mt-4 mb-2">1. Introduction</h2>
        <p>
          Welcome to <strong>MyPnL</strong>. By accessing or using our website and services, you agree to be bound by these
          Terms and Conditions. If you do not agree, please do not use our services.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">2. Services</h2>
        <p>
          MyPnL provides tools for tracking trading performance, journaling trades, and analyzing PnL data. The services
          are provided on a subscription basis with access to premium features.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">3. Account Responsibility</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You are responsible for maintaining the confidentiality of your account.</li>
          <li>You agree to provide accurate and complete information during registration.</li>
          <li>You may not share your login credentials with others.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">4. Subscription & Billing</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Subscriptions are billed as per the selected plan (monthly, yearly, or lifetime).</li>
          <li>No refunds will be provided. Refer to our <a href="/refund-cancellation" className="text-blue-400 underline">Refund Policy</a>.</li>
          <li>You may cancel your subscription at any time from your dashboard.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">5. Use Restrictions</h2>
        <p>You agree <strong>not</strong> to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use the service for illegal activities.</li>
          <li>Reverse-engineer, copy, or resell the platform.</li>
          <li>Upload or share harmful or misleading content.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">6. Intellectual Property</h2>
        <p>
          All content, branding, code, and features of MyPnL are the property of the company and protected by copyright
          and intellectual property laws.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">7. Limitation of Liability</h2>
        <p>
          We are not liable for any loss, damage, or inaccuracies resulting from use of our platform. Use the tools at
          your own discretion and risk.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">8. Changes to Terms</h2>
        <p>
          We may update these Terms at any time. Continued use of the platform means you accept any revised Terms.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">9. Contact Us</h2>
        <p>
          For questions regarding these Terms, contact us at: <a href="mailto:support@mypnl.pro" className="text-blue-400 hover:underline">support@mypnl.pro</a>
        </p>
      </div>
    </main>
  );
};

export default TermsConditions;
