import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { OneBuddyOverlay } from './OneBuddyOverlay';

export const PROVIDER_DEFAULT = null;
export const MapZoomContext = React.createContext<number>(1.0);

const MAP_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = Dimensions.get('window').height;

// Map boundary bounds (calibrated to Hyderabad/Madhapur coordinate range)
const LAT_MIN = 17.30;
const LAT_MAX = 17.48;
const LNG_MIN = 78.36;
const LNG_MAX = 78.52;

const getPercent = (val: number, min: number, max: number) => {
  const percent = ((val - min) / (max - min)) * 100;
  // Keep percent between 18% and 78% so top is between 22% and 82%
  // This guarantees markers NEVER overlap with the top status bar / phone clock or bottom sheet
  return Math.min(Math.max(percent, 18), 78);
};

// Coordinate mapping function
const coordinateToPosition = (latitude: number, longitude: number) => {
  return {
    // Top is inversely related to latitude (higher lat = smaller top)
    top: `${100 - getPercent(latitude, LAT_MIN, LAT_MAX)}%`,
    left: `${getPercent(longitude, LNG_MIN, LNG_MAX)}%`,
  };
};

export const Marker = ({
  coordinate,
  pinColor,
  title,
  subtitle,
  isDestination = false,
  type,
  showCallout = true,
  calloutPlacement = 'auto',
  rideType = 'auto',
}: any) => {
  const mapZoom = React.useContext(MapZoomContext) || 1.0;
  if (!coordinate) return null;
  const position = coordinateToPosition(coordinate.latitude, coordinate.longitude);
  const isDrop = isDestination || type === 'drop' || type === 'destination';
  const isVehicle = type === 'vehicle';
  const placeBottom = calloutPlacement === 'bottom';

  return (
    <View style={[styles.markerContainer, { top: position.top as any, left: position.left as any }]}>
      {showCallout && title ? (
        <View
          style={[
            styles.markerCalloutContainer,
            placeBottom && styles.markerCalloutContainerBottom,
          ]}
        >
          {placeBottom && (
            <View
              style={[
                styles.markerCalloutArrowBottom,
                isVehicle
                  ? styles.vehicleCalloutArrowBottom
                  : isDrop
                  ? styles.dropCalloutArrowBottom
                  : styles.pickupCalloutArrowBottom,
              ]}
            />
          )}
          <View
            style={[
              styles.markerCalloutCard,
              isVehicle
                ? styles.vehicleCalloutCard
                : isDrop
                ? styles.dropCalloutCard
                : styles.pickupCalloutCard,
            ]}
          >
            {isVehicle ? (
              <View style={styles.vehicleTagBadge}>
                <Ionicons
                  name={rideType === 'bike' ? 'bicycle' : rideType === 'cab' ? 'car' : 'car-outline'}
                  size={11}
                  color="#FFFFFF"
                />
                <Text style={styles.vehicleTagText}>ASSIGNED</Text>
              </View>
            ) : isDrop ? (
              <View style={styles.dropCalloutDot} />
            ) : (
              <View style={styles.pickupCalloutSquare} />
            )}
            <Text
              style={[
                styles.markerCalloutText,
                isVehicle && styles.vehicleCalloutText,
                isDrop && styles.dropCalloutText,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          {!placeBottom && (
            <View
              style={[
                styles.markerCalloutArrow,
                isVehicle
                  ? styles.vehicleCalloutArrow
                  : isDrop
                  ? styles.dropCalloutArrow
                  : styles.pickupCalloutArrow,
              ]}
            />
          )}
        </View>
      ) : null}

      <View style={styles.markerPinWrapper}>
        {isVehicle ? (
          <View style={styles.vehiclePinCircle}>
            <Ionicons
              name={rideType === 'bike' ? 'bicycle' : rideType === 'cab' ? 'car' : 'car-outline'}
              size={15}
              color="#16A34A"
            />
          </View>
        ) : isDrop ? (
          <View style={styles.uberDropCircle} />
        ) : (
          <View style={styles.uberPickupSquare} />
        )}
      </View>
    </View>
  );
};

interface MapLandmark {
  id: string;
  name: string;
  top: string;
  left: string;
  type?: 'transit' | 'mall' | 'tech' | 'landmark' | 'area';
  icon?: any;
  color?: string;
}

const DEFAULT_LANDMARKS: MapLandmark[] = [
  { id: '1', name: 'Cyber Towers', top: '22%', left: '16%', type: 'tech', icon: 'business-outline', color: '#4F46E5' },
  { id: '2', name: 'Madhapur Metro', top: '16%', left: '66%', type: 'transit', icon: 'train-outline', color: '#0284C7' },
  { id: '3', name: 'Mindspace IT Park', top: '34%', left: '68%', type: 'tech', icon: 'business-outline', color: '#6366F1' },
  { id: '4', name: 'Inorbit Mall', top: '70%', left: '16%', type: 'mall', icon: 'cart-outline', color: '#EA580C' },
  { id: '5', name: 'Durgam Cheruvu', top: '56%', left: '72%', type: 'landmark', icon: 'water-outline', color: '#0D9488' },
  { id: '6', name: 'Kavuri Hills', top: '80%', left: '46%', type: 'area', icon: 'location-outline', color: '#64748B' },
  { id: '7', name: 'Ayyappa Society', top: '30%', left: '40%', type: 'area', icon: 'location-outline', color: '#64748B' },
  { id: '8', name: 'IKEA Hyderabad', top: '82%', left: '74%', type: 'mall', icon: 'storefront-outline', color: '#2563EB' },
];

export { OneBuddyOverlay };

export const MapView = ({
  style,
  children,
  showRoute = false,
  pickupCoord,
  destCoord,
  showsUserLocation = false,
  showLandmarks = false,
  showOneBuddyOverlay = true,
  rideType,
  overlayTop = '11%',
  overlayLeft = '50%',
  overlaySize = 54,
  zoomControlsStyle,
  initialRegion,
  onRegionChange
}: any) => {
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 3.0;
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const handleZoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, Number((prev + 0.5).toFixed(1))));
  const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, Number((prev - 0.5).toFixed(1))));

  // Render a clean solid black route line directly connecting pickup and drop with road bends
  const renderRoute = () => {
    if (!showRoute || !pickupCoord || !destCoord) return null;

    const p1 = coordinateToPosition(pickupCoord.latitude, pickupCoord.longitude);
    const p2 = coordinateToPosition(destCoord.latitude, destCoord.longitude);

    const x1 = parseFloat(p1.left);
    const y1 = parseFloat(p1.top);
    const x2 = parseFloat(p2.left);
    const y2 = parseFloat(p2.top);

    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const lineWidth = 4.5;
    const midY = minY + (maxY - minY) * 0.45;

    return (
      <View style={styles.routeContainer}>
        {/* Segment 1: from top marker to mid road */}
        <View
          style={[
            styles.routeSegment,
            {
              top: `${Math.min(y1, midY)}%`,
              left: `${x1}%`,
              marginLeft: -lineWidth / 2,
              width: lineWidth,
              height: `${Math.abs(midY - y1)}%`,
            }
          ]}
        />
        {/* Segment 2: horizontal turn */}
        <View
          style={[
            styles.routeSegment,
            {
              top: `${midY}%`,
              marginTop: -lineWidth / 2,
              left: `${minX}%`,
              height: lineWidth,
              width: `${maxX - minX}%`,
            }
          ]}
        />
        {/* Segment 3: from mid road to bottom marker */}
        <View
          style={[
            styles.routeSegment,
            {
              top: `${Math.min(midY, y2)}%`,
              left: `${x2}%`,
              marginLeft: -lineWidth / 2,
              width: lineWidth,
              height: `${Math.abs(y2 - midY)}%`,
            }
          ]}
        />
      </View>
    );
  };

  return (
    <MapZoomContext.Provider value={zoom}>
      <View style={[styles.container, style]}>
        <View style={[styles.mapInner, { transform: [{ scale: zoom }] }]}>
          <Image
            source={require('../assets/mock_map.jpg')}
            style={styles.mapImage}
            resizeMode="cover"
          />

          {/* Surrounding Places / Landmark Badges */}
          {showLandmarks && DEFAULT_LANDMARKS.map((landmark) => (
            <View
              key={landmark.id}
              style={[
                styles.landmarkContainer,
                { top: landmark.top as any, left: landmark.left as any }
              ]}
            >
              {landmark.type !== 'area' ? (
                <View style={styles.landmarkBadge}>
                  <Ionicons name={landmark.icon || 'location'} size={11} color={landmark.color || '#475569'} style={{ marginRight: 3 }} />
                  <Text style={styles.landmarkText} numberOfLines={1}>{landmark.name}</Text>
                </View>
              ) : (
                <View style={styles.areaBadge}>
                  <Text style={styles.areaText}>{landmark.name}</Text>
                </View>
              )}
            </View>
          ))}

          {showsUserLocation && (
            <View style={styles.userLocationContainer}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
              <View style={styles.userLocationTag}>
                <Text style={styles.userLocationTagText}>You are here</Text>
              </View>
            </View>
          )}
          {/* OneBuddy Logo and Vehicle Orbit Animation in the designated area */}
          {showOneBuddyOverlay && (
            <OneBuddyOverlay
              top={overlayTop}
              left={overlayLeft}
              size={overlaySize}
              rideType={rideType}
            />
          )}
        </View>

        {/* Route line connecting pickup and drop - remains stationary during map zoom */}
        {renderRoute()}

        {showsUserLocation && (
          <View style={styles.userLocationContainer}>
            <View style={styles.userLocationPulse} />
            <View style={styles.userLocationDot} />
            <View style={styles.userLocationTag}>
              <Text style={styles.userLocationTagText}>You are here</Text>
            </View>
          </View>
        )}

        {/* Pickup and drop location markers - remain stationary during map zoom */}
        {children}

        {/* Zoom Controls matching Ride Home Screen design & position */}
        <View style={[styles.zoomControls, zoomControlsStyle]}>
          <TouchableOpacity
            style={[styles.zoomButton, zoom >= MAX_ZOOM && styles.zoomButtonDisabled]}
            onPress={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            accessibilityLabel="Zoom in"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={zoom >= MAX_ZOOM ? '#CBD5E1' : '#0F172A'} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={[styles.zoomButton, zoom <= MIN_ZOOM && styles.zoomButtonDisabled]}
            onPress={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            accessibilityLabel="Zoom out"
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={24} color={zoom <= MIN_ZOOM ? '#CBD5E1' : '#0F172A'} />
          </TouchableOpacity>
        </View>
      </View>
    </MapZoomContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
  },
  mapInner: {
    width: '100%',
    height: '100%',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
  zoomButton: {
    width: 44,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonDisabled: {
    opacity: 0.35,
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#CBD5E1',
  },
  markerContainer: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  markerCalloutContainer: {
    position: 'absolute',
    bottom: 24,
    left: -89,
    alignItems: 'center',
    width: 200,
    zIndex: 35,
  },
  markerCalloutContainerBottom: {
    bottom: undefined,
    top: 24,
  },
  markerCalloutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 5,
    maxWidth: 196,
  },
  dropCalloutCard: {
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  pickupCalloutCard: {
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  dropTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54B713',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    gap: 2,
  },
  dropTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  markerCalloutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    includeFontPadding: false,
  },
  dropCalloutText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  pickupCalloutSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  pickupCalloutDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  dropCalloutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#54B713',
    marginRight: 6,
  },
  markerCalloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  markerCalloutArrowBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  dropCalloutArrow: {
    borderTopColor: '#FFFFFF',
  },
  pickupCalloutArrow: {
    borderTopColor: '#FFFFFF',
  },
  dropCalloutArrowBottom: {
    borderBottomColor: '#FFFFFF',
  },
  pickupCalloutArrowBottom: {
    borderBottomColor: '#FFFFFF',
  },
  markerPinWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 22,
    height: 22,
  },
  uberPickupSquare: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  uberDropCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#54B713',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  // Compatibility aliases
  uberDropSquare: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#54B713',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  uberPickupCircle: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  vehicleCalloutCard: {
    borderColor: '#16A34A',
    borderWidth: 2,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  vehicleTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    gap: 3,
  },
  vehicleTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  vehicleCalloutText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleCalloutArrow: {
    borderTopColor: '#16A34A',
  },
  vehicleCalloutArrowBottom: {
    borderBottomColor: '#16A34A',
  },
  vehiclePinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  routeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  routeSegment: {
    position: 'absolute',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  userLocationContainer: {
    position: 'absolute',
    top: '47%',
    left: '47%',
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
  },
  userLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#4285F4',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  userLocationTag: {
    position: 'absolute',
    top: -24,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  userLocationTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  landmarkContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  landmarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  landmarkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  areaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  areaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default MapView;
