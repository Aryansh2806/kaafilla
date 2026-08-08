import { createNavigationContainerRef } from '@react-navigation/native';

// Shared ref so notification taps can navigate even when the tap wakes the app
// from a cold start (the container attaches this ref in RootNavigator). Typed as
// `any` params — this app's stacks aren't statically param-typed.
export const navigationRef = createNavigationContainerRef<any>();

// The data we pack into every push (see the Edge Function). `kind` decides where
// a tap lands; the rest lets a message tap open the exact 1:1 room.
export interface PushData {
  kind?: 'connect' | 'message';
  peerId?: string;
  peerName?: string;
  peerHandle?: string;
}

// Route a notification tap. Connects → the Chats tab (Requests live there);
// messages → straight into the sender's room. No-ops until the nav tree is ready.
export function routeFromPush(data: PushData | undefined): void {
  if (!data || !navigationRef.isReady()) return;
  try {
    if (data.kind === 'message' && data.peerId) {
      navigationRef.navigate('Main', {
        screen: 'Chats',
        params: {
          screen: 'ChatRoom',
          params: {
            peerId: data.peerId,
            name: data.peerName ?? 'Traveller',
            kind: 'solo',
            handle: data.peerHandle ? `@${data.peerHandle}` : undefined,
          },
        },
      });
      return;
    }
    // connect (or anything else) → the Chats tab, where Requests are shown.
    navigationRef.navigate('Main', { screen: 'Chats' });
  } catch {
    // Nav tree not in a state we can target — drop the deep-link silently.
  }
}
