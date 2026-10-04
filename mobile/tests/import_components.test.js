import React from 'react';
import renderer, { act } from 'react-test-renderer';

// Mock expo-document-picker before component imports
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

import { PrivacyBanner } from '../src/components/imports/PrivacyBanner.jsx';
import { StagedTransactionCard } from '../src/components/imports/StagedTransactionCard.jsx';
import { BatchHistoryCard } from '../src/components/imports/BatchHistoryCard.jsx';
import { ImportSourceSelector } from '../src/components/imports/ImportSourceSelector.jsx';
import { SMSPasteModal } from '../src/components/imports/SMSPasteModal.jsx';
import { StagedEditModal } from '../src/components/imports/StagedEditModal.jsx';
import { ImportProgressModal } from '../src/components/imports/ImportProgressModal.jsx';

describe('FinTrack Mobile - Import UI Components', () => {
  it('should render PrivacyBanner with zero-OTP security explanation', () => {
    let tree;
    act(() => {
      tree = renderer.create(<PrivacyBanner />);
    });
    const root = tree.root;

    expect(root.findByProps({ testID: 'privacy-banner' })).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Your data is processed only for financial transaction detection');
    expect(str).toContain('ZERO-OTP RETENTION');
  });

  it('should render StagedTransactionCard with merchant, amount, confidence, and action buttons', () => {
    const mockTx = {
      _id: 'staged_1',
      title: 'Swiggy',
      merchant: 'Swiggy',
      amount: 480,
      type: 'expense',
      category: 'Food',
      source: 'sms',
      confidence: 0.96,
      isDuplicate: false,
    };

    const mockConfirm = jest.fn();
    const mockEdit = jest.fn();
    const mockIgnore = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <StagedTransactionCard
          transaction={mockTx}
          onConfirm={mockConfirm}
          onEdit={mockEdit}
          onIgnore={mockIgnore}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'staged-card-staged_1' })).toBeDefined();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Swiggy');
    expect(str).toContain('96% High Confidence');
    expect(str).toContain('Food');

    // Trigger confirm button
    const confirmBtn = root.findByProps({ testID: 'confirm-btn-staged_1' });
    act(() => {
      confirmBtn.props.onPress();
    });
    expect(mockConfirm).toHaveBeenCalledWith('staged_1');

    // Trigger edit button
    const editBtn = root.findByProps({ testID: 'edit-btn-staged_1' });
    act(() => {
      editBtn.props.onPress();
    });
    expect(mockEdit).toHaveBeenCalledWith(mockTx);
  });

  it('should render duplicate warning on StagedTransactionCard when isDuplicate is true', () => {
    const duplicateTx = {
      _id: 'staged_dupe',
      title: 'Amazon',
      merchant: 'Amazon',
      amount: 1250,
      type: 'expense',
      category: 'Shopping',
      source: 'csv',
      confidence: 0.88,
      isDuplicate: true,
    };

    let tree;
    act(() => {
      tree = renderer.create(
        <StagedTransactionCard
          transaction={duplicateTx}
          onConfirm={jest.fn()}
          onEdit={jest.fn()}
          onIgnore={jest.fn()}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'duplicate-warning-banner' })).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Possible Duplicate Detected');
  });

  it('should render BatchHistoryCard with detected, confirmed, and pending counters', () => {
    const mockBatch = {
      _id: 'batch_1',
      fileName: 'HDFC_Statement.csv',
      source: 'csv',
      totalRecords: 10,
      processedRecords: 10,
      confirmedRecords: 8,
      ignoredRecords: 1,
      status: 'REVIEW_REQUIRED',
    };

    const mockReview = jest.fn();
    const mockDelete = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <BatchHistoryCard
          batch={mockBatch}
          onReviewPress={mockReview}
          onDeletePress={mockDelete}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'batch-card-batch_1' })).toBeDefined();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('HDFC_Statement.csv');
    expect(str).toContain('CSV');
    expect(str).toContain('REVIEW REQUIRED');
  });

  it('should render ImportSourceSelector with CSV, Excel, and SMS options', () => {
    const mockCSV = jest.fn();
    const mockExcel = jest.fn();
    const mockSMS = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <ImportSourceSelector
          onSelectCSV={mockCSV}
          onSelectExcel={mockExcel}
          onSelectSMS={mockSMS}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'import-source-selector' })).toBeDefined();
    expect(root.findByProps({ testID: 'import-csv-card' })).toBeDefined();
    expect(root.findByProps({ testID: 'import-excel-card' })).toBeDefined();
    expect(root.findByProps({ testID: 'import-sms-card' })).toBeDefined();

    // Trigger SMS selection
    const smsCard = root.findByProps({ testID: 'import-sms-card' });
    act(() => {
      smsCard.props.onPress();
    });
    expect(mockSMS).toHaveBeenCalledTimes(1);
  });

  it('should render SMSPasteModal and handle sample load and submission', () => {
    const mockSubmit = jest.fn();
    const mockClose = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <SMSPasteModal
          visible={true}
          isLoading={false}
          onSubmit={mockSubmit}
          onClose={mockClose}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'sms-paste-modal' })).toBeDefined();

    const input = root.findByProps({ testID: 'sms-paste-input' });
    act(() => {
      input.props.onChangeText('₹480 debited via UPI to Swiggy');
    });

    const processBtn = root.findByProps({ testID: 'process-sms-button' });
    act(() => {
      processBtn.props.onPress();
    });

    expect(mockSubmit).toHaveBeenCalledWith('₹480 debited via UPI to Swiggy');
  });

  it('should render StagedEditModal and handle save action with modified fields', () => {
    const mockTx = {
      _id: 'staged_edit_1',
      title: 'Swiggy',
      merchant: 'Swiggy',
      amount: 480,
      type: 'expense',
      category: 'Food',
      paymentMethod: 'upi',
    };

    const mockSave = jest.fn();
    const mockClose = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <StagedEditModal
          visible={true}
          transaction={mockTx}
          onSave={mockSave}
          onClose={mockClose}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'staged-edit-modal' })).toBeDefined();

    const amountInput = root.findByProps({ testID: 'edit-staged-amount-input' });
    act(() => {
      amountInput.props.onChangeText('520');
    });

    const saveBtn = root.findByProps({ testID: 'save-confirm-staged-button' });
    act(() => {
      saveBtn.props.onPress();
    });

    expect(mockSave).toHaveBeenCalledWith('staged_edit_1', expect.objectContaining({
      amount: 520,
      category: 'Food',
      type: 'expense',
    }));
  });

  it('should render ImportProgressModal in completed state with metrics', () => {
    const mockResult = {
      batch: {
        _id: 'b_done',
        processedRecords: 6,
        summary: { highConfidenceCount: 5 },
        duplicateRecords: 1,
      },
      stagedCount: 6,
    };

    let tree;
    act(() => {
      tree = renderer.create(
        <ImportProgressModal
          visible={true}
          isUploading={false}
          uploadStage="completed"
          result={mockResult}
          onClose={jest.fn()}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'import-progress-modal' })).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Transactions Detected');
    expect(str).toContain('6');
    expect(str).toContain('High Confidence');
    expect(str).toContain('Duplicates Flagged');
  });
});
