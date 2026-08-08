import { useEffect } from 'react';
import {
  registerForPushNotificationsAsync,
  savePushToken,
  addPushResponseListener,
  getInitialPushData,
} from './push';
import { routeFromPush } from './navigation';

// Mounted once the user is signed in. Registers this device for push, persists
// the token, and turns notification taps into navigation. All native access is
// lazy-guarded inside push.ts, so a build without the native module (pre-rebuild)
// is a silent no-op, never a crash.
export function usePushNotifications(userId: string | undefined): void {
  // Register + persist the token whenever we have a signed-in user.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (alive && token) await savePushToken(token);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  // Taps: live ones via the listener, plus the cold-start tap that launched the app.
  useEffect(() => {
    const unsub = addPushResponseListener(routeFromPush);
    void getInitialPushData().then((data) => {
      if (data) routeFromPush(data);
    });
    return unsub;
  }, []);
}
