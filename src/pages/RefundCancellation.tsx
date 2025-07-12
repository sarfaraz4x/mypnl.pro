import React from 'react';

const RefundCancellation = () => {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="prose prose-invert max-w-xl text-slate-300">
        <h1 className="text-3xl font-bold text-white mb-6">💳 Refund & Cancellation Policy</h1>

        <h2 className="text-2xl font-semibold text-white mt-4 mb-2">Refund Policy</h2>
        <p>
          At <strong>MyPnL</strong>, we do not offer refunds on any purchases or subscription payments. All payments are
          final and non-refundable, including monthly, yearly, or lifetime plans.
        </p>
        <p>
          We encourage you to explore our features and plans before making a purchase. If you have any questions or
          concerns, feel free to contact us prior to subscribing.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-6 mb-2">Subscription Cancellation</h2>
        <p>You may cancel your subscription at any time directly from your account dashboard.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Upon cancellation, your subscription will remain active until the end of your current billing cycle.</li>
          <li>No further payments will be charged after cancellation.</li>
          <li>Access to premium features will end after your billing period expires.</li>
        </ul>
        <p className="mt-4">
          If you face any issues canceling your subscription, please reach out to us at{' '}
          <a
            href="mailto:sarfarazalam.sa460@gmail.com"
            className="text-blue-400 hover:underline"
          >
            sarfarazalam.sa460@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
};

export default RefundCancellation;
