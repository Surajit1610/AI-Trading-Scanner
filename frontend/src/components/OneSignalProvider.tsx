'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useSession } from '@/lib/auth-client';

export default function OneSignalProvider() {
  const { data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initOneSignal = async () => {
      if (isInitialized) return;
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      if (!appId) {
        console.warn('OneSignal App ID is missing.');
        return;
      }

      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
        });
        setIsInitialized(true);

        // Prompt the user for notification permissions
        OneSignal.Slidedown.promptPush();
      } catch (error) {
        console.error('OneSignal initialization error:', error);
      }
    };

    initOneSignal();
  }, [isInitialized]);

  useEffect(() => {
    // When the user logs in, we bind this browser subscription to their User ID securely
    if (isInitialized && session?.user?.id) {
      OneSignal.login(session.user.id).catch(console.error);
    } else if (isInitialized && !session?.user) {
      OneSignal.logout().catch(console.error);
    }
  }, [isInitialized, session?.user?.id]);

  return null;
}
