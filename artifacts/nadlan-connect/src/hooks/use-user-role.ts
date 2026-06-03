import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";

export function useUserRole() {
  const { isAuthenticated, user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: getGetMyProfileQueryKey(),
    queryFn: () => getMyProfile(),
    enabled: isAuthenticated,
  });

  return {
    isAuthenticated,
    user,
    profile,
    isLoading,
    role: profile?.role || null
  };
}