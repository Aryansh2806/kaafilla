import { useQuery } from '@tanstack/react-query';
import * as catalog from './catalog';

// react-query hooks over the catalog API. Screens use these, never the raw fns.
export const useTrips = () => useQuery({ queryKey: ['trips'], queryFn: catalog.getTrips });
export const useTrip = (id: string) =>
  useQuery({ queryKey: ['trip', id], queryFn: () => catalog.getTrip(id) });
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
