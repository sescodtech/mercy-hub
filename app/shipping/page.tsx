export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-5">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">Shipping Information</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Everything you need to know about delivery</p>
        </div>
      </div>
      <div className="container-site py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white rounded-2xl border border-neutral-100 p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Our Delivery Process</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              We strive to deliver your premium home essentials as quickly and safely as possible.
              All orders are processed within 1-2 business days.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <h3 className="font-medium text-neutral-900 mb-1">Standard Shipping</h3>
                <p className="text-sm text-neutral-500">Delivered within 3-7 business days.</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <h3 className="font-medium text-neutral-900 mb-1">Express Shipping</h3>
                <p className="text-sm text-neutral-500">Delivered within 1-3 business days.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Shipping Costs</h2>
            <p className="text-neutral-600 leading-relaxed">
              Shipping costs are calculated based on your delivery address.
              We offer free shipping on all orders that meet our minimum threshold.
            </p>
            <div className="mt-6 p-4 bg-[#d98c2a]/5 border border-[#d98c2a]/20 rounded-xl text-center">
              <p className="text-sm text-neutral-700">
                Check your final shipping cost at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
