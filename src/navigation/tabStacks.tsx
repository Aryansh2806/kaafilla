import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/tokens';
import { DiscoverFeed } from '../screens/discover/DiscoverFeed';
import { TripDetail } from '../screens/discover/TripDetail';
import { PlanDetail } from '../screens/discover/PlanDetail';
import { FilterSheet } from '../screens/discover/FilterSheet';
import { PriceComparison } from '../screens/discover/PriceComparison';
import { Reviews } from '../screens/discover/Reviews';
import { LocalDiscover } from '../screens/explore/LocalDiscover';
import { PlaceDetail } from '../screens/explore/PlaceDetail';
import { TravellersBoard } from '../screens/travellers/TravellersBoard';
import { TravelerProfile } from '../screens/travellers/TravelerProfile';
import { LookingForCompany } from '../screens/travellers/LookingForCompany';
import { CreatePost } from '../screens/travellers/CreatePost';
import { ChatList } from '../screens/chats/ChatList';
import { ChatRoom } from '../screens/chats/ChatRoom';
import { MyProfile } from '../screens/profile/MyProfile';
import { SettleLedger } from '../screens/profile/SettleLedger';
import { Safety } from '../screens/profile/Safety';
import { EditProfile } from '../screens/profile/EditProfile';
import { Wallet } from '../screens/profile/Wallet';
import { TripHistory } from '../screens/profile/TripHistory';
import { MyTrips } from '../screens/profile/MyTrips';
import { Activity } from '../screens/profile/Activity';
import { MeshDebug } from '../screens/profile/MeshDebug';
import { HostRequests } from '../screens/hosting/HostRequests';

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
} as const;

const DiscoverNav = createNativeStackNavigator();
export function DiscoverStack() {
  return (
    <DiscoverNav.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <DiscoverNav.Screen name="DiscoverFeed" component={DiscoverFeed} />
      <DiscoverNav.Screen name="TripDetail" component={TripDetail} />
      <DiscoverNav.Screen name="PlanDetail" component={PlanDetail} />
      <DiscoverNav.Screen name="PriceComparison" component={PriceComparison} />
      <DiscoverNav.Screen name="Reviews" component={Reviews} />
      <DiscoverNav.Screen name="LocalDiscover" component={LocalDiscover} />
      <DiscoverNav.Screen name="PlaceDetail" component={PlaceDetail} />
      <DiscoverNav.Screen name="FilterSheet" component={FilterSheet} options={{ presentation: 'modal' }} />
      {/* VerifyGate / Joined / Waitlist live in AppStack (app-wide modals). */}
    </DiscoverNav.Navigator>
  );
}

const TravellersNav = createNativeStackNavigator();
export function TravellersStack() {
  return (
    <TravellersNav.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <TravellersNav.Screen name="TravellersBoard" component={TravellersBoard} />
      <TravellersNav.Screen name="TravelerProfile" component={TravelerProfile} />
      <TravellersNav.Screen name="LookingForCompany" component={LookingForCompany} />
      <TravellersNav.Screen name="CreatePost" component={CreatePost} options={{ presentation: 'modal' }} />
    </TravellersNav.Navigator>
  );
}

const ChatsNav = createNativeStackNavigator();
export function ChatsStack() {
  return (
    <ChatsNav.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <ChatsNav.Screen name="ChatList" component={ChatList} />
      <ChatsNav.Screen name="ChatRoom" component={ChatRoom} />
    </ChatsNav.Navigator>
  );
}

const ProfileNav = createNativeStackNavigator();
export function ProfileStack() {
  return (
    <ProfileNav.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <ProfileNav.Screen name="MyProfile" component={MyProfile} />
      <ProfileNav.Screen name="HostRequests" component={HostRequests} />
      <ProfileNav.Screen name="SettleLedger" component={SettleLedger} />
      <ProfileNav.Screen name="Safety" component={Safety} />
      <ProfileNav.Screen name="EditProfile" component={EditProfile} />
      <ProfileNav.Screen name="Wallet" component={Wallet} />
      <ProfileNav.Screen name="TripHistory" component={TripHistory} />
      <ProfileNav.Screen name="MyTrips" component={MyTrips} />
      <ProfileNav.Screen name="Activity" component={Activity} />
      <ProfileNav.Screen name="MeshDebug" component={MeshDebug} />
    </ProfileNav.Navigator>
  );
}
