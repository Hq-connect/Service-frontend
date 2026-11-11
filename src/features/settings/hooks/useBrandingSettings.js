import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { getTenantSlug } from "@/global/utils/tenant";
import { settingsKeys } from "../queries/settings.keys";
import brandingService from "../services/branding.service";
import {
  setHydratedBranding,
  setBrandingDirtyPreview,
  setThemeMode,
} from "../states/settings.slice";
import {
  applyBrandingToDom,
  setCachedBranding,
} from "../utils/brandingCssInjector";

export const useBrandingSettings = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const brandingState = useSelector((state) => state.settings.branding);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: settingsKeys.branding(),
    queryFn: () => brandingService.getBranding(),
    staleTime: 60 * 1000,
  });

  const syncBrandingEverywhere = useCallback(
    (resultData) => {
      const updatedDoc = resultData?.branding || resultData;
      if (!updatedDoc) return;

      const slug = getTenantSlug();
      queryClient.setQueryData(settingsKeys.branding(), resultData);
      setCachedBranding(slug, updatedDoc);
      applyBrandingToDom(updatedDoc);
      dispatch(setHydratedBranding(updatedDoc));
    },
    [dispatch, queryClient]
  );

  const updateIdentityMutation = useMutation({
    mutationFn: (identityData) => {
      // Support both { fields, files } and flat object / FormData
      if (identityData && (identityData.fields || identityData.files)) {
        return brandingService.updateIdentity({
          ...(identityData.fields || {}),
          ...(identityData.files || {}),
        });
      }
      return brandingService.updateIdentity(identityData);
    },
    onSuccess: (resData) => {
      syncBrandingEverywhere(resData);
      toast.success("Brand identity updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update brand identity");
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: (themePatch) => brandingService.updateTheme(themePatch),
    onSuccess: (resData) => {
      syncBrandingEverywhere(resData);
      toast.success("Theme tokens updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update theme tokens");
    },
  });

  const updateComponentsMutation = useMutation({
    mutationFn: (componentsPatch) => {
      const payload = componentsPatch?.meet
        ? componentsPatch
        : { meet: componentsPatch };
      return brandingService.updateComponents(payload);
    },
    onSuccess: (resData) => {
      syncBrandingEverywhere(resData);
      toast.success("Meeting surface tokens updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update component tokens");
    },
  });

  const resetBrandingMutation = useMutation({
    mutationFn: (arg = false) => {
      const flag = typeof arg === "object" && arg !== null ? Boolean(arg.resetIdentity) : Boolean(arg);
      return brandingService.resetBranding(flag);
    },
    onSuccess: (resData) => {
      syncBrandingEverywhere(resData);
      toast.success("Branding reset to platform defaults");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to reset branding");
    },
  });

  /**
   * Live-previews unsaved branding token edits directly in the DOM without saving to the DB
   */
  const previewBranding = useCallback(
    (draftBranding) => {
      const base = data?.branding || brandingState;
      const merged = {
        ...base,
        ...draftBranding,
        identity: { ...(base?.identity || {}), ...(draftBranding?.identity || {}) },
        themes: {
          light: { ...(base?.themes?.light || {}), ...(draftBranding?.themes?.light || {}) },
          dark: { ...(base?.themes?.dark || {}), ...(draftBranding?.themes?.dark || {}) },
        },
        components: {
          meet: {
            ...(base?.components?.meet || {}),
            ...(draftBranding?.components?.meet || draftBranding?.meeting || {}),
          },
        },
        designTokens: { ...(base?.designTokens || {}), ...(draftBranding?.designTokens || {}) },
      };
      applyBrandingToDom(merged);
      dispatch(setBrandingDirtyPreview(true));
    },
    [brandingState, data?.branding, dispatch]
  );

  /**
   * Reverts any unsaved DOM preview back to the last persisted branding document
   */
  const discardPreview = useCallback(() => {
    const persisted = data?.branding || brandingState;
    if (persisted) {
      applyBrandingToDom(persisted);
    }
    dispatch(setBrandingDirtyPreview(false));
  }, [brandingState, data?.branding, dispatch]);

  return {
    branding: data?.branding || brandingState,
    brandingJsonUrl: data?.brandingJsonUrl || null,
    themeMode: brandingState.themeMode,
    isDirtyPreview: brandingState.isDirtyPreview,
    isLoading,
    isError,
    error,
    refetch,
    setThemeMode: (mode) => dispatch(setThemeMode(mode)),
    previewBranding,
    discardPreview,
    updateIdentity: updateIdentityMutation.mutateAsync,
    isUpdatingIdentity: updateIdentityMutation.isPending,
    updateTheme: updateThemeMutation.mutateAsync,
    isUpdatingTheme: updateThemeMutation.isPending,
    updateComponents: updateComponentsMutation.mutateAsync,
    updateMeetingTheme: updateComponentsMutation.mutateAsync,
    isUpdatingComponents: updateComponentsMutation.isPending,
    isUpdatingMeeting: updateComponentsMutation.isPending,
    resetBranding: resetBrandingMutation.mutateAsync,
    isResettingBranding: resetBrandingMutation.isPending,
    isResetting: resetBrandingMutation.isPending,
  };
};

export default useBrandingSettings;
