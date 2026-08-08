import { useState } from 'react';
import { Modal, View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Image } from 'expo-image';

// One pinch/pan/double-tap zoomable page. Reports zoom state up so the pager can
// disable horizontal paging while an image is zoomed in.
function Zoomable({ uri, width, height, onZoom }: { uri: string; width: number; height: number; onZoom: (z: boolean) => void }) {
  const scale = useSharedValue(1);
  const start = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stx = useSharedValue(0);
  const sty = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, start.value * e.scale);
    })
    .onEnd(() => {
      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        start.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        stx.value = 0;
        sty.value = 0;
        runOnJS(onZoom)(false);
      } else {
        start.value = scale.value;
        runOnJS(onZoom)(true);
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = stx.value + e.translationX;
        ty.value = sty.value + e.translationY;
      }
    })
    .onEnd(() => {
      stx.value = tx.value;
      sty.value = ty.value;
    });

  const dtap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        start.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        stx.value = 0;
        sty.value = 0;
        runOnJS(onZoom)(false);
      } else {
        scale.value = withTiming(2.5);
        start.value = 2.5;
        runOnJS(onZoom)(true);
      }
    });

  const gesture = Gesture.Race(dtap, Gesture.Simultaneous(pinch, pan));
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, animStyle]}>
        <Image source={uri} style={{ width, height }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

export function FullscreenGallery({ images, index, visible, onClose }: { images: string[]; index: number; visible: boolean; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const [zoomed, setZoomed] = useState(false);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: index * width, y: 0 }}
        >
          {images.map((uri, i) => (
            <Zoomable key={i} uri={uri} width={width} height={height} onZoom={setZoomed} />
          ))}
        </ScrollView>
        <Pressable onPress={onClose} hitSlop={14} style={styles.close} accessibilityRole="button" accessibilityLabel="Close photo viewer">
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600' }}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  close: { position: 'absolute', top: 44, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
