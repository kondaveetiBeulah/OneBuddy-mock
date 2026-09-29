import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  CheckCircle2,
  UserCheck,
  Navigation,
  MapPin,
  Wrench,
  PartyPopper,
  CircleDot,
} from 'lucide-react-native';
import { TrackingStage, StageInfo } from '../../types';
import { TRACKING_STAGES } from '../../data/mockData';
import { COLORS, RADII, SPACING } from '../../theme';

interface StatusTimelineProps {
  currentStage: TrackingStage;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStage }) => {
  const stagesOrder: TrackingStage[] = [
    'CONFIRMED',
    'ASSIGNED',
    'EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
  ];

  const currentIndex = stagesOrder.indexOf(currentStage);
  const completedCount = currentIndex + (currentStage === 'ARRIVED' || currentStage === 'IN_PROGRESS' || currentStage === 'COMPLETED' ? 1 : 0);
  const totalStages = stagesOrder.length;
  const progressPercent = Math.round(((currentIndex + (currentStage === 'COMPLETED' ? 1 : 0.5)) / totalStages) * 100);

  const renderStageIcon = (key: TrackingStage, isCompleted: boolean, isCurrent: boolean) => {
    const color = isCompleted || isCurrent ? '#FFFFFF' : COLORS.textMuted;
    const size = 16;

    if (isCompleted) {
      return <CheckCircle2 size={size} color="#FFFFFF" />;
    }

    switch (key) {
      case 'CONFIRMED':
        return <CheckCircle2 size={size} color={color} />;
      case 'ASSIGNED':
        return <UserCheck size={size} color={color} />;
      case 'EN_ROUTE':
        return <Navigation size={size} color={color} />;
      case 'ARRIVED':
        return <MapPin size={size} color={color} />;
      case 'IN_PROGRESS':
        return <Wrench size={size} color={color} />;
      case 'COMPLETED':
        return <PartyPopper size={size} color={color} />;
      default:
        return <CircleDot size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar Summary Header */}
      <View style={styles.progressSummaryRow}>
        <View style={styles.progressTextWrapper}>
          <Text style={styles.progressTitle}>
            {currentStage === 'ARRIVED'
              ? 'Professional Arrived at Location'
              : currentStage === 'COMPLETED'
              ? 'Order Fully Completed'
              : currentStage === 'IN_PROGRESS'
              ? 'Service In Progress'
              : `${TRACKING_STAGES[currentIndex]?.label || 'Order Progress'}`}
          </Text>
          <Text style={styles.progressSubtitle}>
            {currentStage === 'ARRIVED'
              ? '4 of 6 milestones reached (Ready to start)'
              : `${currentIndex + 1} of ${totalStages} milestones (${progressPercent}%)`}
          </Text>
        </View>

        <View
          style={[
            styles.stageBadge,
            currentStage === 'ARRIVED' ? styles.arrivedBadge : styles.defaultBadge,
          ]}
        >
          <Text
            style={[
              styles.stageBadgeText,
              currentStage === 'ARRIVED' && styles.arrivedBadgeText,
            ]}
          >
            {currentStage === 'ARRIVED' ? 'ARRIVED ✓' : `${progressPercent}% DONE`}
          </Text>
        </View>
      </View>

      {/* Visual Progress Track */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Timeline Steps */}
      <View style={styles.timelineList}>
        {TRACKING_STAGES.map((stageItem, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const isLast = index === TRACKING_STAGES.length - 1;

          return (
            <View key={stageItem.key} style={styles.stageRow}>
              {/* Left Node & Connector Column */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.completedNode,
                    isCurrent && (stageItem.key === 'ARRIVED' ? styles.arrivedNode : styles.currentNode),
                    isPending && styles.pendingNode,
                  ]}
                >
                  {renderStageIcon(stageItem.key, isCompleted, isCurrent)}
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      (isCompleted || (isCurrent && index < currentIndex)) && styles.completedLine,
                    ]}
                  />
                )}
              </View>

              {/* Right Text Content */}
              <View style={[styles.textCol, isLast && styles.lastTextCol]}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.stageTitle,
                      isCurrent && styles.currentStageTitle,
                      isCompleted && styles.completedStageTitle,
                      isPending && styles.pendingStageTitle,
                    ]}
                  >
                    {stageItem.label}
                  </Text>
                  {isCurrent && stageItem.key === 'ARRIVED' ? (
                    <View style={styles.arrivedDoneBadge}>
                      <Text style={styles.arrivedDoneBadgeText}>DONE • REACHED</Text>
                    </View>
                  ) : isCurrent ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE NOW</Text>
                    </View>
                  ) : isCompleted ? (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneText}>Done ✓</Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.stageDescription,
                    isPending && styles.pendingStageDescription,
                  ]}
                >
                  {stageItem.key === 'ARRIVED' && isCurrent
                    ? 'Technician has reached your doorstep and is ready to verify OTP.'
                    : stageItem.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  progressTextWrapper: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  progressSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  defaultBadge: {
    backgroundColor: COLORS.primaryLight,
  },
  arrivedBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },
  arrivedBadgeText: {
    color: '#15803D',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADII.pill,
  },
  timelineList: {
    marginTop: SPACING.xs,
  },
  stageRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: SPACING.md,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  completedNode: {
    backgroundColor: COLORS.success,
  },
  currentNode: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  arrivedNode: {
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#DCFCE7',
  },
  pendingNode: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 3,
  },
  completedLine: {
    backgroundColor: COLORS.success,
  },
  textCol: {
    flex: 1,
    paddingBottom: SPACING.md,
  },
  lastTextCol: {
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  currentStageTitle: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  completedStageTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  pendingStageTitle: {
    color: COLORS.textMuted,
  },
  activeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  arrivedDoneBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  arrivedDoneBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  doneBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADII.pill,
  },
  doneText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  stageDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  pendingStageDescription: {
    color: COLORS.textMuted,
  },
});
