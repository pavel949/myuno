import { useState, useCallback } from 'react';
// ExcelJS is dynamically imported in parseExcel
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { autoMapColumn, getTargetFields, importTargets } from '@/lib/importTemplates';

export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  fileName: string;
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: string | null;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Max file size: 10MB to prevent DoS
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Sanitize parsed values to prevent prototype pollution
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Prevent prototype pollution by not allowing __proto__, constructor, prototype keys
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeValue((value as Record<string, unknown>)[key]);
    }
    return sanitized;
  }
  return value;
}

// Parse CSV file using Papa Parse (safe, well-maintained library)
async function parseCSV(file: File): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, unknown>[]).map(row => sanitizeValue(row) as Record<string, unknown>);
        resolve({ headers, rows });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Parse Excel file using ExcelJS (safer than xlsx)
async function parseExcel(file: File): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  
  const extension = file.name.toLowerCase().split('.').pop();
  
  if (extension === 'xlsx') {
    await workbook.xlsx.load(arrayBuffer);
  } else if (extension === 'xls') {
    // ExcelJS doesn't natively support .xls, convert via CSV approach or show error
    throw new Error('Legacy .xls format is not supported. Please save your file as .xlsx or .csv');
  } else {
    await workbook.xlsx.load(arrayBuffer);
  }
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error('Worksheet is empty');
  }
  
  const headers: string[] = [];
  const rows: Record<string, unknown>[] = [];
  
  // Get headers from first row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || `Column${colNumber}`);
  });
  
  // Get data rows
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const rowData: Record<string, unknown> = {};
    let hasData = false;
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        let value = cell.value;
        // Handle ExcelJS cell value types
        if (value && typeof value === 'object' && 'result' in value) {
          value = value.result; // Formula result
        }
        if (value && typeof value === 'object' && 'text' in value) {
          value = value.text; // Rich text
        }
        rowData[header] = sanitizeValue(value ?? '');
        if (value !== null && value !== undefined && value !== '') {
          hasData = true;
        }
      }
    });
    
    if (hasData) {
      rows.push(rowData);
    }
  }
  
  return { headers: headers.filter(Boolean), rows };
}

export function useDataImport() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse Excel/CSV file
  const parseFile = useCallback(async (file: File): Promise<ParsedData | null> => {
    setIsLoading(true);
    try {
      // Validate file size to prevent DoS
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large. Maximum size is 10MB.');
        return null;
      }
      
      const extension = file.name.toLowerCase().split('.').pop();
      let headers: string[];
      let rows: Record<string, unknown>[];
      
      if (extension === 'csv') {
        const result = await parseCSV(file);
        headers = result.headers;
        rows = result.rows;
      } else if (extension === 'xlsx' || extension === 'xls') {
        const result = await parseExcel(file);
        headers = result.headers;
        rows = result.rows;
      } else {
        toast.error('Unsupported file format. Please use .xlsx or .csv');
        return null;
      }
      
      if (rows.length === 0) {
        toast.error('File is empty or has no data');
        return null;
      }
      
      const result: ParsedData = {
        headers,
        rows,
        fileName: file.name,
      };
      
      setParsedData(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse file';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate auto-mappings based on column names
  const generateAutoMappings = useCallback((headers: string[], targetId: string): FieldMapping[] => {
    const targetFields = getTargetFields(targetId);
    
    return headers.map(header => ({
      sourceColumn: header,
      targetField: autoMapColumn(header, targetFields),
    }));
  }, []);

  // Update a single field mapping
  const updateMapping = useCallback((sourceColumn: string, targetField: string | null) => {
    setFieldMappings(prev => prev.map(m => 
      m.sourceColumn === sourceColumn 
        ? { ...m, targetField } 
        : m
    ));
  }, []);

  // Transform parsed data according to mappings
  const transformData = useCallback((data: ParsedData, mappings: FieldMapping[]): Record<string, unknown>[] => {
    const activeMappings = mappings.filter(m => m.targetField);
    
    return data.rows.map(row => {
      const transformed: Record<string, unknown> = {};
      
      for (const mapping of activeMappings) {
        const value = row[mapping.sourceColumn];
        if (value !== undefined && value !== '') {
          // Type conversions
          if (mapping.targetField?.includes('price') || mapping.targetField?.includes('rating')) {
            transformed[mapping.targetField] = parseFloat(String(value)) || 0;
          } else if (mapping.targetField?.startsWith('is_') || mapping.targetField?.includes('stock')) {
            transformed[mapping.targetField] = Boolean(value) || value === 'true' || value === '1' || value === 'yes';
          } else if (mapping.targetField?.includes('quantity')) {
            transformed[mapping.targetField] = parseInt(String(value), 10) || 0;
          } else {
            transformed[mapping.targetField] = String(value);
          }
        }
      }
      
      return transformed;
    });
  }, []);

  // Import data to database
  const importData = useCallback(async (
    targetId: string, 
    data: Record<string, unknown>[], 
    selectedIndices?: number[]
  ): Promise<ImportResult> => {
    setIsLoading(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    
    try {
      const target = importTargets.find(t => t.id === targetId);
      if (!target) {
        throw new Error('Invalid import target');
      }
      
      // Filter selected rows if specified
      const recordsToImport = selectedIndices 
        ? data.filter((_, i) => selectedIndices.includes(i))
        : data;
      
      // Validate required fields
      const validRecords: Record<string, unknown>[] = [];
      for (let i = 0; i < recordsToImport.length; i++) {
        const record = recordsToImport[i];
        const missingFields = target.requiredFields.filter(f => !record[f]);
        
        if (missingFields.length > 0) {
          result.failed++;
          result.errors.push(`Row ${i + 1}: Missing required fields: ${missingFields.join(', ')}`);
        } else {
          validRecords.push(record);
        }
      }
      
      if (validRecords.length === 0) {
        toast.error('No valid records to import');
        return result;
      }
      
      // Batch insert using edge function
      const { data: responseData, error } = await supabase.functions.invoke('bulk-import', {
        body: {
          table: target.table,
          records: validRecords,
        },
      });
      
      if (error) {
        throw error;
      }
      
      result.success = responseData?.inserted || validRecords.length;
      result.failed += responseData?.failed || 0;
      if (responseData?.errors) {
        result.errors.push(...responseData.errors);
      }
      
      setImportResult(result);
      
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} records`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} records failed to import`);
      }
      
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      toast.error(`Import failed: ${message}`);
      result.errors.push(message);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setParsedData(null);
    setFieldMappings([]);
    setImportResult(null);
  }, []);

  return {
    parsedData,
    fieldMappings,
    isLoading,
    importResult,
    parseFile,
    generateAutoMappings,
    setFieldMappings,
    updateMapping,
    transformData,
    importData,
    reset,
  };
}
