import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components/BottomTabBar';
import { DiscoverStack, TravellersStack, ChatsStack, ProfileStack } from './tabStacks';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="Travellers" component={TravellersStack} />
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="You" component={ProfileStack} />
    </Tab.Navigator>
  );
}
