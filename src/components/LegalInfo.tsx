import React from 'react';

const LegalInfo = () => {
  return (
    <div className="prose prose-invert max-w-none text-slate-300">
      <div id="privacy" className="mb-12">
        <h2 className="text-2xl font-bold text-white">🔒 Privacy Policy</h2>
        <p>MyPnL values your privacy.</p>
        <p>We collect only the information necessary to provide and improve our services—such as uploaded screenshots, usage data, and email for login. All data is securely stored and never shared or sold to third parties.</p>
        <p>We use encryption and best practices to ensure your data stays safe. You can request deletion of your account and all associated data at any time.</p>
        <p>For any questions, contact us at <a href="mailto:quickhelix460@gmail.com" className="text-blue-400 hover:underline">quickhelix460@gmail.com</a>.</p>
      </div>

      <div id="terms" className="mb-12">
        <h2 className="text-2xl font-bold text-white">📜 Terms of Service</h2>
        <p>By using MyPnL, you agree to the following:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>You retain full ownership of your uploaded content.</li>
          <li>You are responsible for ensuring the accuracy of your trading screenshots.</li>
          <li>MyPnL is not a financial advisor and does not provide trading recommendations.</li>
          <li>We may update features or terms from time to time; continued use means you accept the changes.</li>
          <li>Violation of terms may lead to account suspension or termination.</li>
        </ul>
      </div>

      <div id="contact">
        <h2 className="text-2xl font-bold text-white">📬 Contact Us</h2>
        <p>Have a question, feedback, or need support? Reach out anytime—we're here to help.</p>
        <ul className="space-y-2">
                    <li>📧 Email: <a href="mailto:quickhelix460@gmail.com" className="text-blue-400 hover:underline">quickhelix460@gmail.com</a></li>
          <li>🌐 Website: <a href="https://www.mypnl.co" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">www.mypnl.co</a></li>
          <li>📍 Based in: India</li>
        </ul>
      </div>
    </div>
  );
};

export default LegalInfo;
