import { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { FullscreenGallery } from './FullscreenGallery';

// Swipeable, paged photo gallery (Amazon-style product hero). Dots track the
// active page; a top scrim keeps an overlaid back button legible. Tapping a
// photo opens a full-screen pinch-to-zoom viewer.
export function PhotoCarousel({ images, height = 280 }: { images: string[]; height?: number }) {
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  if (!images.length) return null;

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIdx(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ width, height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
      >
        {images.map((uri, i) => (
          <Pressable key={i} onPress={() => setViewer(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} of ${images.length} — tap to view full screen`}>
            <Image source={uri} style={{ width, height }} contentFit="cover" transition={250} cachePolicy="memory-disk" />
          </Pressable>
        ))}
      </ScrollView>

      <FullscreenGallery images={images} index={viewer ?? 0} visible={viewer !== null} onClose={() => setViewer(null)} />

      <View style={styles.topScrim} pointerEvents="none" />

      {images.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, backgroundColor: 'rgba(10,11,18,0.32)' },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
});
