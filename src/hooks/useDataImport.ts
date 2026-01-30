import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { autoMapColumn, getTargetFields, importTargets } from '@/lib/importTemplates';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
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

export function useDataImport() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse Excel/CSV file
  const parseFile = useCallback(async (file: File): Promise<ParsedData | null> => {
    setIsLoading(true);
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
            
            if (json.length === 0) {
              toast.error('File is empty or has no data');
              resolve(null);
              return;
            }
            
            const headers = Object.keys(json[0]);
            const result: ParsedData = {
              headers,
              rows: json,
              fileName: file.name,
            };
            
            setParsedData(result);
            resolve(result);
          } catch (err) {
            console.error('Parse error:', err);
            toast.error('Failed to parse file');
            reject(err);
          }
        };
        
        reader.onerror = () => {
          toast.error('Failed to read file');
          reject(new Error('File read error'));
        };
        
        reader.readAsArrayBuffer(file);
      });
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
  const transformData = useCallback((data: ParsedData, mappings: FieldMapping[]): Record<string, any>[] => {
    const activeMappings = mappings.filter(m => m.targetField);
    
    return data.rows.map(row => {
      const transformed: Record<string, any> = {};
      
      for (const mapping of activeMappings) {
        const value = row[mapping.sourceColumn];
        if (value !== undefined && value !== '') {
          // Type conversions
          if (mapping.targetField?.includes('price') || mapping.targetField?.includes('rating')) {
            transformed[mapping.targetField] = parseFloat(value) || 0;
          } else if (mapping.targetField?.startsWith('is_') || mapping.targetField?.includes('stock')) {
            transformed[mapping.targetField] = Boolean(value) || value === 'true' || value === '1' || value === 'yes';
          } else if (mapping.targetField?.includes('quantity')) {
            transformed[mapping.targetField] = parseInt(value, 10) || 0;
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
    data: Record<string, any>[], 
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
      const validRecords: Record<string, any>[] = [];
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
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(`Import failed: ${err.message}`);
      result.errors.push(err.message);
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
