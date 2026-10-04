import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const ImportSourceSelector = ({
  onSelectCSV,
  onSelectExcel,
  onSelectSMS,
  isUploading = false,
}) => {
  const handlePickCSV = async () => {
    if (isUploading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (!file.name.toLowerCase().endsWith('.csv')) {
          Alert.alert('Invalid File Format', 'Please select a valid .csv file.');
          return;
        }
        onSelectCSV(file);
      }
    } catch (err) {
      console.warn('[ImportSourceSelector] DocumentPicker CSV error:', err);
      Alert.alert('File Selection Error', 'Could not open file picker. Please try again.');
    }
  };

  const handlePickExcel = async () => {
    if (isUploading) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const lower = file.name.toLowerCase();
        if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
          Alert.alert('Invalid File Format', 'Please select a valid Excel spreadsheet (.xlsx or .xls).');
          return;
        }
        onSelectExcel(file);
      }
    } catch (err) {
      console.warn('[ImportSourceSelector] DocumentPicker Excel error:', err);
      Alert.alert('File Selection Error', 'Could not open file picker. Please try again.');
    }
  };

  return (
    <View style={styles.container} testID="import-source-selector">
      <Text variant="subtitle" style={styles.sectionTitle}>
        Select Import Source
      </Text>

      {/* CSV Option */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handlePickCSV}
        disabled={isUploading}
        activeOpacity={0.75}
        testID="import-csv-card"
      >
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text variant="subtitle" color={colors.textPrimary}>
                CSV Bank Statement
              </Text>
              <Badge label=".CSV" variant="primary" size="sm" />
            </View>
            <Text variant="caption" color={colors.textSecondary} style={styles.subtext}>
              Upload exported bank ledger or credit card statement in CSV format
            </Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </Card>
      </TouchableOpacity>

      {/* Excel Option */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handlePickExcel}
        disabled={isUploading}
        activeOpacity={0.75}
        testID="import-excel-card"
      >
        <Card style={styles.card}>
          <View style={[styles.iconCircle, styles.excelIconCircle]}>
            <Text style={styles.icon}>📊</Text>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text variant="subtitle" color={colors.textPrimary}>
                Excel Spreadsheet
              </Text>
              <Badge label=".XLSX / .XLS" variant="info" size="sm" />
            </View>
            <Text variant="caption" color={colors.textSecondary} style={styles.subtext}>
              Upload native Excel statement files with multi-column financial records
            </Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </Card>
      </TouchableOpacity>

      {/* SMS Option */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={onSelectSMS}
        disabled={isUploading}
        activeOpacity={0.75}
        testID="import-sms-card"
      >
        <Card style={styles.card}>
          <View style={[styles.iconCircle, styles.smsIconCircle]}>
            <Text style={styles.icon}>💬</Text>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text variant="subtitle" color={colors.textPrimary}>
                SMS / Message Alerts
              </Text>
              <Badge label="INSTANT TEXT" variant="success" size="sm" />
            </View>
            <Text variant="caption" color={colors.textSecondary} style={styles.subtext}>
              Paste UPI / NetBanking transaction messages or test with demo SMS alerts
            </Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </Card>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  excelIconCircle: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  smsIconCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginRight: spacing.sm,
  },
  subtext: {
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});

export default ImportSourceSelector;
