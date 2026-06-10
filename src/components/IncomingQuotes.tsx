import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { useAuth } from "@/lib/auth";
import { getSupplierQuoteRequests } from "@/lib/quotes";

export function IncomingQuotes({ supplierId }: { supplierId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["incoming-quotes", supplierId],
    queryFn: () => getSupplierQuoteRequests(supplierId),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["incoming-quotes", supplierId] });

  return (
    <div className="rounded-3xl bg-card border border-border p-6">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Inbox className="h-5 w-5" /> الطلبات الواردة ({requests.length})
      </h3>
      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground py-6">جاري التحميل…</div>
      ) : requests.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-6">
          لا توجد طلبات عروض أسعار بعد.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {requests.map((r) => (
            <OrderCard
              key={r.id}
              order={r}
              role="supplier"
              currentUserId={user?.id ?? ""}
              onChange={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
