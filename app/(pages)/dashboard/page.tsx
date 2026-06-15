import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import Link from "next/link";
import {
  ShoppingBag, Package, Heart, User,
  ArrowRight, TrendingUp, Clock,
} from "lucide-react";

async function getDashboardData(userId: string) {
  try {
    await connectDB();
    const [orders, recentOrders] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber orderStatus total createdAt items")
        .lean(),
    ]);
    const totalSpent = await Order.aggregate([
      { $match: { user: userId, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    return {
      totalOrders: orders,
      totalSpent:  totalSpent[0]?.total ?? 0,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    };
  } catch {
    return { totalOrders: 0, totalSpent: 0, recentOrders: [] };
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  out_for_delivery: "bg-orange-50 text-orange-700 border-orange-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

function formatPrice(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/auth/login");
  if (session.user.role === "admin") redirect("/admin");

  const { totalOrders, totalSpent, recentOrders } = await getDashboardData(session.user.id as string);
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const QUICK_LINKS = [
    { label: "My Orders",   href: "/dashboard/orders",  Icon: ShoppingBag, desc: "Track your purchases" },
    { label: "Wishlist",    href: "/dashboard/wishlist", Icon: Heart,       desc: "Saved items" },
    { label: "My Profile",  href: "/dashboard/profile",  Icon: User,        desc: "Account settings" },
  ];

  return (
    <div className="min-h-screen bg-[#fdf8f0]">

      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400 mb-0.5">Welcome back</p>
              <h1 className="font-display text-2xl font-semibold text-neutral-900">
                Hi, {firstName} 👋
              </h1>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container-site py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Orders",
              value: totalOrders,
              Icon:  ShoppingBag,
              color: "text-blue-600",
              bg:    "bg-blue-50",
            },
            {
              label: "Total Spent",
              value: formatPrice(totalSpent),
              Icon:  TrendingUp,
              color: "text-[#d98c2a]",
              bg:    "bg-[#d98c2a]/10",
            },
            {
              label: "Active Orders",
              value: recentOrders.filter((o: any) =>
                ["pending", "confirmed", "processing", "shipped", "out_for_delivery"].includes(o.orderStatus)
              ).length,
              Icon:  Clock,
              color: "text-purple-600",
              bg:    "bg-purple-50",
            },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-neutral-100 p-5">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ label, href, Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4 hover:border-[#d98c2a]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-11 h-11 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#d98c2a] transition-colors">
                  <Icon className="w-5 h-5 text-[#d98c2a] group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 ml-auto flex-shrink-0 group-hover:text-[#d98c2a] transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-neutral-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-[#d98c2a] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center">
              <Package className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm mb-1">No orders yet</p>
              <p className="text-neutral-400 text-xs mb-5">Your orders will appear here once you place one.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <Link
                  key={order._id}
                  href={`/dashboard/orders?order=${order._id}`}
                  className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-5 flex items-center gap-4 hover:border-[#d98c2a]/30 hover:shadow-sm transition-all"
                >
                  {/* Order icon */}
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-neutral-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-neutral-900 font-mono truncate">
                        {order.orderNumber}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[order.orderStatus] ?? STATUS_COLORS.pending}`}>
                        {order.orderStatus?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-400">{formatDate(order.createdAt)}</p>
                      <p className="text-sm font-bold text-neutral-900">{formatPrice(order.total)}</p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile shop CTA */}
        <div className="sm:hidden">
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#d98c2a] text-white text-sm font-semibold rounded-xl hover:bg-[#c47020] transition-colors"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
