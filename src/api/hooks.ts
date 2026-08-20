import { useQuery } from '@tanstack/react-query';
import * as catalog from './catalog';
import * as economy from './economy';
import * as plans from './plans';
import * as notifications from './notifications';
import { hasBackend } from './client';

// react-query hooks over the catalog API. Screens use these, never the raw fns.
export const useTrips = () => useQuery({ queryKey: ['trips'], queryFn: catalog.getTrips });
export const useTrip = (id: string) =>
  useQuery({ queryKey: ['trip', id], queryFn: () => catalog.getTrip(id) });
export const useDepartures = (productId?: string | null) =>
  useQuery({
    queryKey: ['departures', productId],
    queryFn: () => catalog.getDepartures(productId!),
    enabled: !!productId,
  });
export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: catalog.getPlans });
export const usePlan = (id: string) =>
  useQuery({ queryKey: ['plan', id], queryFn: () => catalog.getPlan(id) });
export const useOperator = (id: string) =>
  useQuery({ queryKey: ['operator', id], queryFn: () => catalog.getOperator(id), enabled: !!id });
export const useReviews = (operatorId: string) =>
  useQuery({ queryKey: ['reviews', operatorId], queryFn: () => catalog.getReviews(operatorId) });
export const useItinerary = (tripId: string) =>
  useQuery({ queryKey: ['itinerary', tripId], queryFn: () => catalog.getItinerary(tripId) });
export const useExploreRegion = (key: string) =>
  useQuery({ queryKey: ['explore', key], queryFn: () => catalog.getExploreRegion(key) });
export const usePeople = () => useQuery({ queryKey: ['people'], queryFn: catalog.getPeople });
export const usePerson = (id: string) =>
  useQuery({ queryKey: ['person', id], queryFn: () => catalog.getPerson(id) });

// ── ₹49 economy (feature #8) ──
// `retry: false` so that when the economy schema/function isn't deployed yet the
// query fails fast and the screen falls back instead of hammering a 404.
export const useWallet = () =>
  useQuery({ queryKey: ['wallet'], queryFn: economy.getWallet, enabled: hasBackend, retry: false });
export const useWaitlist = (tripId: string) =>
  useQuery({
    queryKey: ['waitlist', tripId],
    queryFn: () => economy.getWaitlist(tripId),
    enabled: hasBackend && !!tripId,
    retry: false,
  });

// ── plan-join flow (feature #8 host-charge trigger) ──
export const useMyJoinStatus = (planId: string) =>
  useQuery({ queryKey: ['joinStatus', planId], queryFn: () => plans.getMyJoinStatus(planId), enabled: hasBackend && !!planId, retry: false });
export const useHostRequests = () =>
  useQuery({ queryKey: ['hostRequests'], queryFn: plans.getHostRequests, enabled: hasBackend, retry: false });

// ── notifications (stage20) ──
// Backend-only: with no backend Activity is legitimately empty, so these stay
// disabled rather than falling back to seed. Realtime keeps both keys fresh.
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: notifications.getNotifications, enabled: hasBackend, retry: false });
export const useUnreadCount = () =>
  useQuery({ queryKey: ['unreadCount'], queryFn: notifications.unreadNotificationCount, enabled: hasBackend, retry: false });
