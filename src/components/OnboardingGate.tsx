import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { isOnboardingComplete, onboardingKey } from "@/lib/onboarding";

// المسارات المسموح بها للمستخدم المسجَّل قبل إكمال بياناته.
const ALLOWED_WHILE_INCOMPLETE = new Set(["/onboarding", "/auth"]);

// بوابة عامة: تُجبر أي مستخدم مسجَّل لم يُكمل بياناته (الدور + بيانات المنشأة)
// على صفحة /onboarding، وتمنعه من تصفّح بقية الموقع حتى يُكمل التسجيل.
// لا تؤثر على الزوّار غير المسجَّلين (يتصفّحون كالمعتاد مع حجب بيانات المورّد).
export function OnboardingGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: complete, isLoading } = useQuery({
    queryKey: onboardingKey(user?.id),
    queryFn: () => isOnboardingComplete(user!.id),
    enabled: !!user,
    staleTime: 0,
  });

  useEffect(() => {
    if (loading || !user || isLoading) return;
    if (complete) return;
    if (ALLOWED_WHILE_INCOMPLETE.has(pathname)) return;
    navigate({ to: "/onboarding" });
  }, [loading, user, isLoading, complete, pathname, navigate]);

  return null;
}
