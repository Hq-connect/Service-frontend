import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  isPushSupported,
  getActiveSubscription,
  subscribeToBrowserPush,
  unsubscribeFromBrowserPush,
} from "../utils/pushManager";
import { setPushPermission } from "../states/notification.slice";

export const usePushNotifications = () => {
  const dispatch = useDispatch();
  const pushPermission = useSelector((state) => state.notifications?.pushPermission);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    setSupported(true);

    if (typeof Notification !== "undefined") {
      dispatch(setPushPermission(Notification.permission));
    }

    const sub = await getActiveSubscription();
    setIsSubscribed(!!sub);
  }, [dispatch]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const subscribe = async () => {
    setLoading(true);
    try {
      await subscribeToBrowserPush();
      setIsSubscribed(true);
      if (typeof Notification !== "undefined") {
        dispatch(setPushPermission(Notification.permission));
      }
      return true;
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribeFromBrowserPush();
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error("Failed to disable push notifications:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    supported,
    isSubscribed,
    permission: pushPermission,
    loading,
    subscribe,
    unsubscribe,
    refreshStatus: checkStatus,
  };
};

export default usePushNotifications;
