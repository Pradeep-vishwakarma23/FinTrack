import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import api, { getApiBaseUrl } from './api.js';
import secureStore from './secureStore.js';

export const reportService = {
  /**
   * Fetches deterministic monthly financial report JSON.
   * @param {string} month 'YYYY-MM'
   */
  getMonthlyReport: async (month) => {
    const params = month ? { month } : {};
    return await api.get('/reports/monthly', { params });
  },

  /**
   * Generates the direct URL for downloading/streaming the PDF report.
   * @param {string} month 'YYYY-MM'
   */
  getMonthlyReportPDFUrl: (month) => {
    const baseUrl = getApiBaseUrl();
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return `${baseUrl}/reports/monthly/pdf${query}`;
  },

  /**
   * Securely downloads the monthly report PDF using authenticated download stream,
   * validates and decodes the binary PDF bytes, saves it to user-accessible storage
   * (via StorageAccessFramework on Android) or document storage, and returns valid URIs.
   * @param {string} month 'YYYY-MM'
   * @returns {Promise<{ success: boolean, uri: string, shareUri: string, filename: string, savedToUserStorage: boolean }>}
   */
  downloadMonthlyReportPDF: async (month) => {
    const baseUrl = getApiBaseUrl();
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const downloadUrl = `${baseUrl}/reports/monthly/pdf${query}`;

    // Standardized filename: FinTrack_Report_YYYY_MM.pdf
    const formattedMonth = (month || new Date().toISOString().slice(0, 7)).replace(/-/g, '_');
    const filename = `FinTrack_Report_${formattedMonth}.pdf`;

    const stagingDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const tempFileUri = `${stagingDir}temp_${Date.now()}_${filename}`;

    const token = await secureStore.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempFileUri, {
      headers,
    });

    if (!downloadResult || downloadResult.status !== 200) {
      const statusCode = downloadResult?.status;
      if (statusCode === 401) {
        throw new Error('Authentication required to export financial report.');
      }
      throw new Error(`Failed to download report (HTTP ${statusCode || 'unknown'}).`);
    }

    // Inspect file content to verify valid binary PDF structure
    try {
      const fileHeader = await FileSystem.readAsStringAsync(tempFileUri, {
        length: 64,
        encoding: FileSystem.EncodingType.UTF8,
      });

      // If the downloaded content is Base64 text, decode it into raw binary PDF bytes
      if (fileHeader.startsWith('data:application/pdf;base64,') || fileHeader.startsWith('JVBERi')) {
        const fullContent = await FileSystem.readAsStringAsync(tempFileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const cleanBase64 = fullContent.replace(/^data:application\/pdf;base64,/, '').trim();
        await FileSystem.writeAsStringAsync(tempFileUri, cleanBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (fileHeader.startsWith('{"') && fileHeader.includes('"success":false')) {
        const errorContent = await FileSystem.readAsStringAsync(tempFileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const parsed = JSON.parse(errorContent);
        throw new Error(parsed.message || 'Server error exporting PDF report.');
      }
    } catch (checkErr) {
      if (checkErr.message?.includes('Server error') || checkErr.message?.includes('Authentication')) {
        throw checkErr;
      }
      // Pure binary PDF content is already valid
    }

    // Persist verified file in permanent app documentDirectory
    const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
    const docFileUri = `${docDir}${filename}`;
    try {
      if (tempFileUri !== docFileUri) {
        await FileSystem.copyAsync({ from: tempFileUri, to: docFileUri });
      }
    } catch (copyErr) {
      console.warn('[reportService] copy to documentDirectory error:', copyErr?.message || copyErr);
    }

    let finalUri = docFileUri;
    let shareUri = docFileUri;
    let savedToUserStorage = false;

    // On Android, use StorageAccessFramework to prompt and save to user-selected Downloads/Documents
    if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
      try {
        let initialUri = null;
        try {
          if (typeof FileSystem.StorageAccessFramework.getUriForDirectoryInRoot === 'function') {
            initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
          }
        } catch {
          initialUri = null;
        }

        const permissionResult = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
        if (permissionResult && permissionResult.granted && permissionResult.directoryUri) {
          const dirUri = permissionResult.directoryUri;
          const base64Data = await FileSystem.readAsStringAsync(docFileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const baseFileName = filename.replace(/\.pdf$/i, '');
          const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
            dirUri,
            baseFileName,
            'application/pdf'
          );

          await FileSystem.StorageAccessFramework.writeAsStringAsync(safUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          finalUri = safUri;
          shareUri = safUri;
          savedToUserStorage = true;
        }
      } catch (safErr) {
        console.warn('[reportService] SAF directory export error:', safErr?.message || safErr);
      }
    }

    // If not using SAF URI, obtain a valid Android FileProvider content URI
    if (!savedToUserStorage && Platform.OS === 'android' && typeof FileSystem.getContentUriAsync === 'function') {
      try {
        shareUri = await FileSystem.getContentUriAsync(finalUri);
      } catch {
        shareUri = finalUri;
      }
    }

    // Clean up temporary staging file if distinct
    try {
      if (tempFileUri !== docFileUri && tempFileUri !== finalUri) {
        await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
      }
    } catch {
      // Ignored
    }

    return {
      success: true,
      uri: finalUri,
      shareUri,
      filename,
      savedToUserStorage,
    };
  },
};

export default reportService;

