import React from 'react';
import { FlatList } from 'react-native';
import renderer, { act } from 'react-test-renderer';

// Mock DocumentPicker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

let mockState = {
  imports: {
    batches: [
      {
        _id: 'batch_1',
        fileName: 'statement.csv',
        source: 'csv',
        processedRecords: 5,
        confirmedRecords: 3,
        ignoredRecords: 0,
        status: 'REVIEW_REQUIRED',
      },
    ],
    stagedTransactions: [
      {
        _id: 'st_1',
        title: 'Swiggy',
        merchant: 'Swiggy',
        amount: 480,
        type: 'expense',
        category: 'Food',
        source: 'sms',
        confidence: 0.95,
        isDuplicate: false,
        importBatchId: 'batch_1',
      },
      {
        _id: 'st_2',
        title: 'Amazon',
        merchant: 'Amazon',
        amount: 1250,
        type: 'expense',
        category: 'Shopping',
        source: 'csv',
        confidence: 0.72,
        isDuplicate: true,
        importBatchId: 'batch_1',
      },
    ],
    pendingCount: 2,
    selectedBatchId: 'all',
    selectedTransaction: null,
    isEditModalOpen: false,
    isSMSPasteModalOpen: false,
    isLoadingBatches: false,
    isLoadingStaged: false,
    isUploading: false,
    uploadStage: 'idle',
    isReviewing: false,
    lastImportResult: null,
    error: null,
    uploadError: null,
  },
};

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn(mockState),
}));

import { ImportsScreen } from '../src/screens/imports/ImportsScreen.jsx';
import { StagedReviewScreen } from '../src/screens/imports/StagedReviewScreen.jsx';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('FinTrack Mobile - Import Screens & Review Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render ImportsScreen with pending banner, source selector, and batch history', () => {
    let tree;
    act(() => {
      tree = renderer.create(<ImportsScreen navigation={mockNavigation} />);
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'imports-pending-banner' })).toBeDefined();
    expect(root.findByProps({ testID: 'import-source-selector' })).toBeDefined();
    expect(root.findByProps({ testID: 'privacy-banner' })).toBeDefined();

    // Tapping Review Now on pending banner navigates to StagedReview
    const reviewBtn = root.findByProps({ testID: 'review-now-button' });
    act(() => {
      reviewBtn.props.onPress();
    });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('StagedReview', { batchId: 'all' });
  });

  it('should render StagedReviewScreen with staged data, confirm all button, and filter tabs', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <StagedReviewScreen route={{ params: { batchId: 'all' } }} navigation={mockNavigation} />
      );
    });

    const root = tree.root;

    // Verify FlatList has staged transactions data
    const flatList = root.findByType(FlatList);
    expect(flatList).toBeDefined();
    expect(flatList.props.data).toHaveLength(2);

    // Verify ListHeaderComponent has confirm all button and info banner
    let headerTree;
    act(() => {
      headerTree = renderer.create(flatList.props.ListHeaderComponent);
    });
    expect(headerTree.root.findByProps({ testID: 'confirm-all-button' })).toBeDefined();

    const str = JSON.stringify(headerTree.toJSON());
    expect(str).toContain('STAGING QUEUE');

    // Verify renderItem outputs a StagedTransactionCard
    let renderedCardTree;
    act(() => {
      renderedCardTree = renderer.create(
        flatList.props.renderItem({ item: mockState.imports.stagedTransactions[0] })
      );
    });
    expect(renderedCardTree.root.findByProps({ testID: 'staged-card-st_1' })).toBeDefined();
  });

  it('should render empty "All Caught Up" state in StagedReviewScreen when no staged items remain', () => {
    const originalStaged = mockState.imports.stagedTransactions;
    const originalPending = mockState.imports.pendingCount;

    mockState.imports.stagedTransactions = [];
    mockState.imports.pendingCount = 0;

    let tree;
    act(() => {
      tree = renderer.create(
        <StagedReviewScreen route={{ params: { batchId: 'all' } }} navigation={mockNavigation} />
      );
    });

    const root = tree.root;
    const flatList = root.findByType(FlatList);
    expect(flatList).toBeDefined();
    expect(flatList.props.data).toHaveLength(0);

    let emptyTree;
    act(() => {
      emptyTree = renderer.create(flatList.props.ListEmptyComponent);
    });

    expect(emptyTree.root.findByProps({ testID: 'all-caught-up-card' })).toBeDefined();
    const str = JSON.stringify(emptyTree.toJSON());
    expect(str).toContain('All Caught Up!');
    expect(str).toContain('All detected transactions have been verified');

    // Restore state
    mockState.imports.stagedTransactions = originalStaged;
    mockState.imports.pendingCount = originalPending;
  });
});
