import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "passwordHash">;

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { companyName: string; username: string; password: string; fullName?: string; email?: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { companyName?: string; fullName?: string; email?: string; emailFromAddress?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/password", data);
      return res.json();
    },
  });

  const updateEmailApiKeyMutation = useMutation({
    mutationFn: async (data: { emailApiKey: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/email-api-key", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const isAuthenticated = !isLoading && !error && !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    registerPending: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    logoutPending: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    updateProfilePending: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    changePasswordPending: changePasswordMutation.isPending,
    updateEmailApiKey: updateEmailApiKeyMutation.mutateAsync,
    updateEmailApiKeyPending: updateEmailApiKeyMutation.isPending,
  };
}
