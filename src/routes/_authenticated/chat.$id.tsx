import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ChatPanel } from "@/components/ChatPanel";
import { useAuth } from "@/lib/auth";
import { getOrderById, getBuyerContact } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  head: () => ({ meta: [{ title: "المحادثة — مدد" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { id } = useParams({ from: "/_authenticated/chat/$id" });
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
  });

  const isBuyer = !!user && !!order && order.buyer_id === user.id;
  const { data: buyer } = useQuery({
    queryKey: ["buyer-contact", order?.buyer_id],
    queryFn: () => getBuyerContact(order!.buyer_id),
    enabled: !!order && !isBuyer,
  });

  const otherName = isBuyer
    ? (order?.supplier?.name ?? "المورّد")
    : (buyer?.business_name ?? "المشتري");
  const backTo = isBuyer ? "/my-requests" : "/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-4 flex-1 flex flex-col max-w-2xl w-full">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جاري التحميل…</div>
        ) : !order ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">الطلب غير موجود أو لا تملك صلاحية الوصول.</p>
            <Link to="/my-requests" className="inline-block mt-4 font-bold text-primary">
              العودة لطلباتي
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col rounded-3xl bg-card border border-border overflow-hidden">
            {/* ترويسة المحادثة */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Link
                to={backTo}
                className="p-2 -mr-2 rounded-xl hover:bg-secondary text-muted-foreground"
                aria-label="رجوع"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="h-10 w-10 rounded-full bg-brand-soft text-primary flex items-center justify-center font-extrabold">
                {otherName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{otherName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <Package className="h-3 w-3" />{" "}
                  {order.product?.name ?? order.custom_product ?? "طلب"}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[55vh]">
              <ChatPanel quoteId={order.id} currentUserId={user?.id ?? ""} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
