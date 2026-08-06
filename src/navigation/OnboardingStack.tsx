import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Splash } from '../screens/onboarding/Splash';
import { ValueProp } from '../screens/onboarding/ValueProp';
import { PhoneEntry } from '../screens/onboarding/PhoneEntry';
import { OTPVerify } from '../screens/onboarding/OTPVerify';
import { PhotoUpload } from '../screens/onboarding/PhotoUpload';
import { ProfileBuild } from '../screens/onboarding/ProfileBuild';
import { TravelPrefs } from '../screens/onboarding/TravelPrefs';

const Stack = createNativeStackNavigator();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#161826' } }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="ValueProp" component={ValueProp} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntry} />
      <Stack.Screen name="OTPVerify" component={OTPVerify} />
      <Stack.Screen name="PhotoUpload" component={PhotoUpload} />
      <Stack.Screen name="ProfileBuild" component={ProfileBuild} />
      <Stack.Screen name="TravelPrefs" component={TravelPrefs} />
    </Stack.Navigator>
  );
}
