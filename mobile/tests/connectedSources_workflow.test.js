import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NotificationStatusCard } from '../src/components/notifications/NotificationStatusCard.jsx';
import { DetectionHistoryCard } from '../src/components/notifications/DetectionHistoryCard.jsx';
import { PermissionExplanationModal } from '../src/components/notifications/PermissionExplanationModal.jsx';

let mockState = {
  notifications: {
    isConnected: true,
    isPermissionGranted: true,
    isEnabled: true,
    stats: {
      totalEvents: 15,
      stagedCount: 5,
      confirmedCount: 8,
      duplicatesCount: 2,
      lastDetectedAt: '2026-09-26T14:42:00.000Z',
    },
    isPermissionModalOpen: false,
    error: null,
  },
  imports: {
    pendingCount: 5,
  },
};

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn(mockState),
}));

import { ConnectedSourcesScreen } from '../src/screens/notifications/ConnectedSourcesScreen.jsx';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('FinTrack Mobile - Connected Sources & Notification Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render NotificationStatusCard in connected state with toggle action', () => {
    const mockToggle = jest.fn();
    let tree;
    act(() => {
      tree = renderer.create(
        <NotificationStatusCard
          isConnected={true}
          isEnabled={true}
          lastDetectedAt="2026-09-26T14:42:00.000Z"
          onToggle={mockToggle}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'notification-status-card' })).toBeDefined();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('CONNECTED');
    expect(str).toContain('Notification Listener Active');

    const toggleBtn = root.findByProps({ testID: 'notification-toggle-button' });
    act(() => {
      toggleBtn.props.onPress();
    });
    expect(mockToggle).toHaveBeenCalledWith(false);
  });

  it('should render DetectionHistoryCard with accurate activity metrics', () => {
    const mockStats = {
      totalEvents: 20,
      stagedCount: 6,
      confirmedCount: 12,
      duplicatesCount: 2,
    };

    let tree;
    act(() => {
      tree = renderer.create(<DetectionHistoryCard stats={mockStats} />);
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'detection-history-card' })).toBeDefined();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Detection Activity & Ingestion Stats');
    expect(str).toContain('20');
    expect(str).toContain('6');
    expect(str).toContain('12');
  });

  it('should render PermissionExplanationModal and handle settings intent', () => {
    const mockOpenSettings = jest.fn();
    const mockCancel = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <PermissionExplanationModal
          visible={true}
          onOpenSettings={mockOpenSettings}
          onCancel={mockCancel}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'permission-explanation-modal' })).toBeDefined();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Enable Notification Access');
    expect(str).toContain('Filtered on-device before any financial information is processed');
    expect(str).toContain('Sensitive OTPs, PINs, CVVs, and passwords are never collected');

    const settingsBtn = root.findByProps({ testID: 'open-settings-button' });
    act(() => {
      settingsBtn.props.onPress();
    });
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('should render ConnectedSourcesScreen with status, history, and evaluation buttons', () => {
    let tree;
    act(() => {
      tree = renderer.create(<ConnectedSourcesScreen navigation={mockNavigation} />);
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'notification-status-card' })).toBeDefined();
    expect(root.findByProps({ testID: 'detection-history-card' })).toBeDefined();
    expect(root.findByProps({ testID: 'synthetic-test-section' })).toBeDefined();
    expect(root.findByProps({ testID: 'connected-sources-pending-card' })).toBeDefined();

    // Verify synthetic buttons exist
    expect(root.findByProps({ testID: 'test-debit-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'test-income-button' })).toBeDefined();
    expect(root.findByProps({ testID: 'test-otp-button' })).toBeDefined();
  });
});
