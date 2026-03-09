import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { parseCSV, validateRow, FieldDef, ValidationError, generateCSV, downloadFile } from '@/lib/csv-utils';

export interface ImportJob {
  id: string;
  moduleId: string;
  fileName: string;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  errors: ImportError[];
}

export interface ImportError {
  rowNumber: number;
  rowData: Record<string, any>;
  errorMessage: string;
}

export function useImportExport(moduleId: string, fields: FieldDef[]) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [importing, setImporting] = useState(false);

  const importRecords = useCallback(
    async (rows: Record<string, string>[], columnMapping: Record<string, string>, fileName: string) => {
      setImporting(true);
      const totalRows = rows.length;
      const currentJob: ImportJob = {
        id: `job-${Date.now()}`,
        moduleId,
        fileName,
        status: 'validating',
        totalRows,
        processedRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [],
      };
      setJob({ ...currentJob });

      const { data: dbJob } = await api.post('/api/import_jobs', {
        module_id: moduleId,
        file_name: fileName,
        status: 'importing',
        total_rows: totalRows,
      });
      const jobId = (dbJob as any)?.id;

      const mappedRows: { mapped: Record<string, any>; original: Record<string, string>; rowNum: number }[] = [];
      const validationErrors: ImportError[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const mapped: Record<string, any> = {};
        for (const [csvCol, crmField] of Object.entries(columnMapping)) {
          if (crmField && row[csvCol] !== undefined) {
            let val: any = row[csvCol];
            const field = fields.find((f) => f.fieldKey === crmField);
            if (field && (field.fieldType === 'number' || field.fieldType === 'currency')) {
              val = Number(String(val).replace(/[$,]/g, '')) || 0;
            }
            mapped[crmField] = val;
          }
        }
        const errors = validateRow(mapped, fields);
        if (errors.length > 0) {
          validationErrors.push({
            rowNumber: i + 2,
            rowData: row,
            errorMessage: errors.map((e) => e.message).join('; '),
          });
        } else {
          mappedRows.push({ mapped, original: row, rowNum: i + 2 });
        }
      }

      currentJob.status = 'importing';
      currentJob.failedRows = validationErrors.length;
      currentJob.errors = validationErrors;
      setJob({ ...currentJob });

      const BATCH_SIZE = 100;
      for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
        const batch = mappedRows.slice(i, i + BATCH_SIZE);
        const insertRows = batch.map((b) => ({ module_id: moduleId, values: b.mapped }));
        const { error } = await api.post('/api/crm_records/bulk', insertRows);
        if (error) {
          batch.forEach((b) => {
            currentJob.failedRows++;
            currentJob.errors.push({
              rowNumber: b.rowNum,
              rowData: b.original,
              errorMessage: (error as any).message,
            });
          });
        } else {
          currentJob.successRows += batch.length;
        }
        currentJob.processedRows = Math.min(i + BATCH_SIZE, mappedRows.length) + validationErrors.length;
        setJob({ ...currentJob });
      }

      currentJob.status = 'completed';
      currentJob.processedRows = totalRows;
      setJob({ ...currentJob });

      if (jobId) {
        await api.patch(`/api/import_jobs/${jobId}`, {
          status: 'completed',
          processed_rows: totalRows,
          success_rows: currentJob.successRows,
          failed_rows: currentJob.failedRows,
          completed_at: new Date().toISOString(),
        });
        if (currentJob.errors.length > 0) {
          const errorInserts = currentJob.errors.map((e) => ({
            job_id: jobId,
            row_number: e.rowNumber,
            row_data: e.rowData,
            error_message: e.errorMessage,
          }));
          await api.post('/api/import_errors', errorInserts);
        }
      }

      setImporting(false);
      return currentJob;
    },
    [moduleId, fields]
  );

  const exportRecords = useCallback(
    (
      records: Record<string, any>[],
      exportFields: FieldDef[],
      format: 'csv' | 'excel' = 'csv',
      moduleName: string = 'records'
    ) => {
      const headers = exportFields.map((f) => f.fieldKey);
      const headerLabels = exportFields.map((f) => f.label);
      const rows = records.map((r) => {
        const row: Record<string, any> = {};
        exportFields.forEach((f) => {
          row[f.label] = r.values?.[f.fieldKey] ?? r[f.fieldKey] ?? '';
        });
        return row;
      });
      const csv = generateCSV(headerLabels, rows);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `${moduleName}-export-${timestamp}.csv`);
    },
    []
  );

  const downloadErrorReport = useCallback(() => {
    if (!job?.errors.length) return;
    const headers = ['Row', 'Error', ...Object.keys(job.errors[0].rowData || {})];
    const rows = job.errors.map((e) => ({
      Row: String(e.rowNumber),
      Error: e.errorMessage,
      ...e.rowData,
    }));
    const csv = generateCSV(headers, rows);
    downloadFile(csv, `import-errors-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [job]);

  const resetJob = useCallback(() => setJob(null), []);

  return {
    job,
    importing,
    importRecords,
    exportRecords,
    downloadErrorReport,
    resetJob,
  };
}
