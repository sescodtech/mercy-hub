import { Order, Product } from "@/lib/models";

/** Release stock reserved for an unpaid/cancelled order exactly once. */
export async function releaseReservedStock(orderId: string) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "paid" }, stockReleasedAt: { $exists: false } },
    { $set: { stockReleasedAt: new Date() } },
    { new: true }
  ).lean();
  if (!order) return false;

  await Promise.all(
    order.items.map((item: any) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    )
  );
  return true;
}
