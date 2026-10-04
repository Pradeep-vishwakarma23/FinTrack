import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const SpendingAnomaliesSection = ({ anomalies = [], onExplain }) => {
  const list = Array.isArray(anomalies) ? anomalies : [];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text variant="subtitle" weight="bold">
            Spending Anomalies
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Outliers, spikes & budget shocks
          </Text>
        </View>
        <Badge
          label={`${list.length} Detected`}
          variant={list.length > 0 ? 'danger' : 'success'}
          size="sm"
        />
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
            No unusual spending detected. All expenses match your typical historical baseline.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {list.map((item, idx) => {
            const isHigh = item.severity === 'HIGH';
            return (
              <View key={item.transactionId || idx} style={styles.anomalyItem}>
                <View style={styles.itemTopRow}>
                  <View style={styles.itemTitleContainer}>
                    <Text variant="body" weight="bold" numberOfLines={1}>
                      {item.title || item.merchant}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {item.category} • {formatDate(item.transactionDate, { short: true })}
                    </Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text variant="subtitle" color={colors.danger} weight="bold">
                      {formatCurrency(item.amount)}
                    </Text>
                    <Badge
                      label={item.anomalyType || 'OUTLIER'}
                      variant={isHigh ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </View>
                </View>
                <View style={styles.reasonBox}>
                  <Text variant="caption" color={colors.textSecondary} style={styles.reasonText}>
                    ⚠️ {item.reason}
                  </Text>
                  {onExplain && (
                    <TouchableOpacity
                      onPress={() => onExplain(item)}
                      style={styles.explainItemBtn}
                      activeOpacity={0.7}
                      testID={`explain-anomaly-${idx}`}
                    >
                      <Text variant="caption" color={colors.primaryLight} weight="bold">
                        💡 Explain
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    minWidth: 150,
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    gap: spacing.sm,
  },
  anomalyItem: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  itemTitleContainer: {
    flex: 1,
    minWidth: 140,
    marginRight: spacing.xs,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  reasonBox: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  reasonText: {
    flex: 1,
  },
  explainItemBtn: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight + '40',
  },
});

export default SpendingAnomaliesSection;
