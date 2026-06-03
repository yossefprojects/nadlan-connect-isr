import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";

export function useUserRole() {
  const { isAuthenticated, user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: getGetMyProfileQueryKey(),
    queryFn: () => getGetMyProfile(),
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