import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/tokens';
import { MainTabs } from './MainTabs';
import { VerifyGate } from '../screens/verify/VerifyGate';
import { AadhaarOTP } from '../screens/verify/AadhaarOTP';
import { SelfieCapture } from '../screens/verify/SelfieCapture';
import { Matching } from '../screens/verify/Matching';
import { VerifySuccess } from '../screens/verify/VerifySuccess';
import { Joined } from '../screens/waitlist/Joined';
import { WaitlistView } from '../screens/waitlist/WaitlistView';
import { CreatePlan } from '../screens/hosting/CreatePlan';

const Stack = createNativeStackNavigator();

// App-wide stack over the tabs: the verification flow (and later waitlist/hosting
// modals) live here so any tab can navigate to them.
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="VerifyGate" component={VerifyGate} options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="AadhaarOTP" component={AadhaarOTP} />
        <Stack.Screen name="SelfieCapture" component={SelfieCapture} />
        <Stack.Screen name="Matching" component={Matching} />
        <Stack.Screen name="VerifySuccess" component={VerifySuccess} />
        <Stack.Screen name="Joined" component={Joined} />
        <Stack.Screen name="Waitlist" component={WaitlistView} />
        <Stack.Screen name="CreatePlan" component={CreatePlan} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
