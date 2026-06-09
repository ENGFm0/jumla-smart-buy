import { getUserRoles } from "@/lib/auth";
import { getSupplierByUserId } from "@/lib/suppliers";
import { getMyBuyerProfile } from "@/lib/buyer";

// مفتاح موحّد لحالة إكمال التسجيل في react-query
export const onboardingKey = (userId: string | undefined) => ["onboarding-complete", userId];

// يُعتبر التسجيل مكتملاً إذا اختار المستخدم دوراً وعبّأ بياناته الأساسية:
//  - مورّد   → لديه سجل في suppliers
//  - صاحب محل → لديه سجل في buyer_profiles
//  - أدمن    → مكتمل دائماً
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  if (roles.includes("admin")) return true;
  if (roles.includes("supplier")) {
    const supplier = await getSupplierByUserId(userId);
    if (supplier) return true;
  }
  if (roles.includes("shop_owner")) {
    const buyer = await getMyBuyerProfile();
    if (buyer) return true;
  }
  return false;
}
