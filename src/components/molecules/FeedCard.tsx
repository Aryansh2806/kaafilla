import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient as SvgLinear, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { LeadBadge, Tag } from '../atoms/Badges';
import { RatioBar } from '../atoms/Progress';
import { Avatar } from '../atoms/Avatar';
import { gradients } from '../../theme/tokens';
import { heroImage } from '../../data/tripImages';
import type { Trip, Plan } from '../../types';

const fmtK = (n: number) => `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;

// Real destination photo when available; the SVG gradient stays behind it as a
// fallback (shown while loading or if the image ever fails).
function Hero({ label, gid, uri }: { label: string; gid: string; uri?: string }) {
  const t = useTheme();
  return (
    <View style={styles.hero}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgLinear id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradients.sectionGlow[0]} />
            <Stop offset="0.62" stopColor={gradients.sectionGlow[1]} />
            <Stop offset="1" stopColor={gradients.sectionGlow[2]} />
          </SvgLinear>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${gid})`} />
      </Svg>
      {uri ? (
        <>
          <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
          {/* subtle scrim so badges + label stay legible over any photo */}
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        </>
      ) : null}
      <Text
        style={{
          color: uri ? '#fff' : t.colors.accentL2,
          fontSize: t.typography.size.body2,
          fontWeight: uri ? '600' : '400',
          opacity: uri ? 1 : 0.7,
          textShadowColor: uri ? 'rgba(0,0,0,0.55)' : 'transparent',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function FeedCard(props: ({ type: 'trip'; data: Trip } | { type: 'plan'; data: Plan }) & { verified: boolean; onPress: () => void }) {
  const t = useTheme();
  const { verified, onPress } = props;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderColor: t.colors.n800, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Hero label={props.data.place} gid={`h-${props.data.id}`} uri={heroImage(props.data.id, props.data.region)} />
      <View style={styles.badges}>
        {props.type === 'plan' && <LeadBadge lead="plan" />}
        <LeadBadge lead={props.data.lead} />
      </View>

      <View style={{ padding: 14 }}>
        {props.type === 'trip' ? (
          <>
            <Text style={[styles.name, { color: t.colors.text, fontSize: t.typography.size.xl }]}>{props.data.name}</Text>
            <Text style={{ color: t.colors.accentL3, fontSize: t.typography.size['2xl'], fontWeight: '600', marginTop: 2 }}>{fmtK(props.data.price)}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.sm, marginTop: 4 }}>
              {props.data.days} days · {props.data.place} · {props.data.month}
            </Text>
            <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2, marginTop: 2 }}>
              {props.data.stay} · {props.data.difficulty} · group of {props.data.groupSize} · from {props.data.cities}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.name, { color: t.colors.text, fontSize: t.typography.size.xl }]}>{props.data.name}</Text>
            <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.sm, marginTop: 4 }}>
              {props.data.days} days · {props.data.place} · {props.data.month}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <Avatar name={props.data.hostName} size={28} />
              <Text style={{ color: t.colors.textSub, fontSize: t.typography.size.body2 }}>
                Planned by {props.data.hostName} · about {fmtK(props.data.costEach)} each
              </Text>
            </View>
          </>
        )}

        {verified && props.type === 'trip' && (
          <View style={{ marginTop: 12 }}>
            <RatioBar women={props.data.womenPct} />
          </View>
        )}

        <View style={styles.footer}>
          {props.type === 'trip' ? (
            <>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{props.data.waitlist} waitlisted</Text>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{props.data.operators} operators · ★ {props.data.rating}</Text>
            </>
          ) : (
            <>
              <Text style={{ color: t.colors.textMuted, fontSize: t.typography.size.xs }}>{props.data.joined} of {props.data.groupSize} joined</Text>
              <Tag label={props.data.dates === 'flexible' ? 'FLEXIBLE DATES' : 'FIXED DATES'} tone="neutral" />
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  hero: { height: 120, alignItems: 'flex-start', justifyContent: 'flex-end', padding: 12, overflow: 'hidden' },
  scrim: { backgroundColor: 'rgba(15,17,26,0.22)' },
  badges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  name: { fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
});
