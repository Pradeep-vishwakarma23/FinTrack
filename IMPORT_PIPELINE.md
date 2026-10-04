# FinTrack Ingestion & Staging Pipeline Architecture

## 1. Unified Staging Architecture
FinTrack enforces a **Staged Review Pattern** across all input channels. No external transaction file or message commits directly into the active financial ledger without user validation.

```mermaid
flowchart TD
    subgraph Sources [Ingestion Channels]
        CSV["CSV Bank Statement"]
        Excel["Excel Spreadsheet (.xlsx, .xls)"]
        SMS["SMS / Message Ingestion"]
    end

    subgraph Intelligence [Transaction Intelligence Layer]
        Parser["Channel Parsers (fileParserService / smsParserService)"]
        Sanitizer["Sensitive Data Redaction"]
        Categorizer["Merchant & Category Heuristics"]
        Scorer["Multi-Factor Confidence Scoring"]
        Fingerprint["SHA-256 Fingerprinting & Dup Detection"]
    end

    subgraph Storage [Staging Storage]
        BatchDoc["ImportBatch Document"]
        StagedDoc["Transaction (status = 'staged')"]
    end

    subgraph Actions [Interactive Review UI]
        ReviewTable["/imports Review Table"]
        ConfirmBtn["✓ Confirm Single / Bulk"]
        EditBtn["✎ Inline Edit"]
        IgnoreBtn["✕ Ignore"]
    end

    subgraph PrimaryLedger [Primary Financial Ledger]
        Ledger["Transaction (status = 'confirmed')"]
        Dashboard["Dashboard Aggregates & Analytics"]
    end

    Sources --> Parser
    Parser --> Sanitizer
    Sanitizer --> Categorizer
    Categorizer --> Scorer
    Scorer --> Fingerprint
    Fingerprint --> BatchDoc
    Fingerprint --> StagedDoc
    BatchDoc --> ReviewTable
    StagedDoc --> ReviewTable
    ReviewTable -->|Confirm| Ledger
    ReviewTable -->|Edit| StagedDoc
    ReviewTable -->|Ignore| StagedDoc
    Ledger --> Dashboard
```

---

## 2. Ingestion Channels & Capabilities

| Channel | Input Formats | Features | Status |
| :--- | :--- | :--- | :--- |
| **Bank Statements** | `.csv`, `.xlsx`, `.xls` | Universal column aliasing (HDFC, ICICI, SBI, Axis, Kotak, generic formats), Indian date format normalizer (`DD/MM/YYYY`), currency cleaner | **Phase 1 Complete** |
| **SMS / Messages** | Pasted text, `.txt`, `.csv` | Amount detection, debit/credit detection, merchant extraction, OTP/PIN redaction, confidence scoring, demo dataset | **Phase 2 Complete** |

---

## 3. Review Operations API

- **Confirm Single**: `POST /api/imports/transactions/:id/confirm`
- **Inline Edit**: `PATCH /api/imports/transactions/:id`
- **Ignore**: `POST /api/imports/transactions/:id/ignore`
- **Confirm All Batch**: `POST /api/imports/:id/confirm-all`
- **Delete Batch**: `DELETE /api/imports/:id`
