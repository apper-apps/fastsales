import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Label from '@/components/atoms/Label';
import Card from '@/components/atoms/Card';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import leadsService from '@/services/api/leadsService';
import { toast } from 'react-toastify';

const CSVImportModal = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationResults, setValidationResults] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [importSettings, setImportSettings] = useState({
    skipDuplicates: true,
    updateDuplicates: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const leadFields = [
    { value: 'name', label: 'Name', required: true },
    { value: 'email', label: 'Email', required: true },
    { value: 'phone', label: 'Phone', required: true },
    { value: 'status', label: 'Status', required: false },
    { value: 'source', label: 'Source', required: false },
    { value: 'notes', label: 'Notes', required: false },
    { value: 'company', label: 'Company', required: false },
    { value: 'position', label: 'Position', required: false }
  ];

  const statusOptions = [
    'New Leads',
    'Initial Contact',
    'Presentation Scheduled',
    'Presented',
    'Follow-up',
    'Closed Won',
    'Closed Lost'
  ];

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({});
    setValidationResults([]);
    setDuplicates([]);
    setImportSettings({ skipDuplicates: true, updateDuplicates: false });
    setIsProcessing(false);
    setImportProgress(0);
    setDragActive(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file. Please check the format.');
          setIsProcessing(false);
          return;
        }

        if (results.data.length === 0) {
          toast.error('CSV file appears to be empty');
          setIsProcessing(false);
          return;
        }

        const csvHeaders = Object.keys(results.data[0]);
        setHeaders(csvHeaders);
        setCsvData(results.data);
        
        // Auto-map columns based on common field names
        const autoMapping = {};
        csvHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          const matchedField = leadFields.find(field => 
            lowerHeader.includes(field.value) || 
            field.value.includes(lowerHeader) ||
            (field.value === 'name' && (lowerHeader.includes('full') || lowerHeader.includes('first') || lowerHeader.includes('last'))) ||
            (field.value === 'email' && lowerHeader.includes('mail')) ||
            (field.value === 'phone' && (lowerHeader.includes('tel') || lowerHeader.includes('mobile')))
          );
          if (matchedField) {
            autoMapping[header] = matchedField.value;
          }
        });
        
        setColumnMapping(autoMapping);
        setIsProcessing(false);
        setStep(2);
        toast.success(`CSV parsed successfully! Found ${results.data.length} records`);
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        setIsProcessing(false);
      }
    });
  };

  const handleMappingChange = (csvColumn, leadField) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: leadField
    }));
  };

  const validateData = async () => {
    setIsProcessing(true);
    const results = [];
    const duplicateEmails = [];
    
    try {
      const existingLeads = await leadsService.getAll();
      const existingEmails = new Set(existingLeads.map(lead => lead.email.toLowerCase()));
      
      csvData.forEach((row, index) => {
        const result = {
          rowIndex: index,
          data: row,
          mappedData: {},
          errors: [],
          warnings: [],
          isDuplicate: false
        };

        // Map data according to column mapping
        Object.entries(columnMapping).forEach(([csvColumn, leadField]) => {
          if (leadField && row[csvColumn] !== undefined) {
            result.mappedData[leadField] = row[csvColumn];
          }
        });

        // Validate required fields
        leadFields.filter(field => field.required).forEach(field => {
          if (!result.mappedData[field.value] || result.mappedData[field.value].trim() === '') {
            result.errors.push(`${field.label} is required`);
          }
        });

        // Validate email format
        if (result.mappedData.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(result.mappedData.email)) {
            result.errors.push('Invalid email format');
          } else {
            // Check for duplicates
            const emailLower = result.mappedData.email.toLowerCase();
            if (existingEmails.has(emailLower)) {
              result.isDuplicate = true;
              result.warnings.push('Email already exists in system');
              duplicateEmails.push({
                row: index,
                email: result.mappedData.email,
                existingLead: existingLeads.find(lead => lead.email.toLowerCase() === emailLower)
              });
            }
          }
        }

// Validate phone format (basic validation)
        if (result.mappedData.phone) {
          const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
          const cleanPhone = result.mappedData.phone.replace(/[\s\-()]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            result.warnings.push('Phone number format may be invalid');
          }
        }

        // Validate status
        if (result.mappedData.status && !statusOptions.includes(result.mappedData.status)) {
          result.warnings.push(`Status "${result.mappedData.status}" will be set to "New Leads"`);
          result.mappedData.status = 'New Leads';
        }

        if (!result.mappedData.status) {
          result.mappedData.status = 'New Leads';
        }

        results.push(result);
      });

      setValidationResults(results);
      setDuplicates(duplicateEmails);
      setIsProcessing(false);
      setStep(3);
      
      const errorCount = results.filter(r => r.errors.length > 0).length;
      const warningCount = results.filter(r => r.warnings.length > 0).length;
      
      if (errorCount > 0) {
        toast.warning(`Validation complete: ${errorCount} errors, ${warningCount} warnings`);
      } else {
        toast.success(`Validation complete: ${results.length} records ready for import`);
      }
    } catch (error) {
      toast.error('Error during validation');
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setImportProgress(0);
    
    try {
      const validRecords = validationResults.filter(result => {
        if (result.errors.length > 0) return false;
        if (result.isDuplicate && importSettings.skipDuplicates && !importSettings.updateDuplicates) return false;
        return true;
      });

      if (validRecords.length === 0) {
        toast.error('No valid records to import');
        setIsProcessing(false);
        return;
      }

      const leadsToCreate = validRecords.map(result => ({
        name: result.mappedData.name,
        email: result.mappedData.email,
        phone: result.mappedData.phone,
        status: result.mappedData.status || 'New Leads',
        source: result.mappedData.source || 'CSV Import',
        notes: result.mappedData.notes || '',
        company: result.mappedData.company || '',
        position: result.mappedData.position || ''
      }));

      // Import in batches for better performance
      const batchSize = 10;
      let imported = 0;
      
      for (let i = 0; i < leadsToCreate.length; i += batchSize) {
        const batch = leadsToCreate.slice(i, i + batchSize);
        
        for (const leadData of batch) {
          if (importSettings.updateDuplicates) {
            const duplicate = duplicates.find(d => d.email === leadData.email);
            if (duplicate) {
              await leadsService.update(duplicate.existingLead.Id, leadData);
            } else {
              await leadsService.create(leadData);
            }
          } else {
            await leadsService.create(leadData);
          }
          imported++;
          setImportProgress(Math.round((imported / leadsToCreate.length) * 100));
        }
      }

      toast.success(`Successfully imported ${imported} leads!`);
      
      // Refresh the leads list
      if (onImport) {
        await onImport();
      }
      
      handleClose();
    } catch (error) {
      toast.error('Error importing leads');
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
        <p className="text-gray-600">Choose a CSV file containing your leads data</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <ApperIcon name="Upload" size={24} className="text-gray-600" />
          </div>
          
          {file ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">Drag and drop your CSV file here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
            </div>
          )}
          
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="outline" className="cursor-pointer">
              <ApperIcon name="FolderOpen" size={16} className="mr-2" />
              Choose File
            </Button>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <ApperIcon name="Info" size={16} className="text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>File must include headers in the first row</li>
              <li>Required fields: Name, Email, Phone</li>
              <li>Maximum file size: 5MB</li>
              <li>Supported encoding: UTF-8</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Map CSV Columns</h3>
        <p className="text-gray-600">Match your CSV columns to lead fields</p>
      </div>

      <div className="grid gap-4">
        {headers.map((header, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">{header}</Label>
              <p className="text-xs text-gray-500 mt-1">
                Sample: {csvData[0] && csvData[0][header] ? csvData[0][header] : 'No data'}
              </p>
            </div>
            <div className="flex-1">
              <Select
                value={columnMapping[header] || ''}
                onChange={(e) => handleMappingChange(header, e.target.value)}
                className="w-full"
              >
                <option value="">Skip this column</option>
                {leadFields.map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label} {field.required && '*'}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ApperIcon name="AlertTriangle" size={16} className="text-yellow-600 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Required Fields:</p>
            <p>Make sure to map Name, Email, and Phone columns. These are required for all leads.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const validCount = validationResults.filter(r => r.errors.length === 0).length;
    const errorCount = validationResults.filter(r => r.errors.length > 0).length;
    const duplicateCount = duplicates.length;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Validation Results</h3>
          <p className="text-gray-600">Review the validation results before importing</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{validCount}</div>
            <div className="text-sm text-gray-600">Valid Records</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{duplicateCount}</div>
            <div className="text-sm text-gray-600">Duplicates</div>
          </Card>
        </div>

        {duplicateCount > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Duplicate Handling</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duplicateHandling"
                  checked={importSettings.skipDuplicates && !importSettings.updateDuplicates}
                  onChange={() => setImportSettings({ skipDuplicates: true, updateDuplicates: false })}
                  className="mr-2"
                />
                Skip duplicate records
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="duplicateHandling"
                  checked={importSettings.updateDuplicates}
                  onChange={() => setImportSettings({ skipDuplicates: false, updateDuplicates: true })}
                  className="mr-2"
                />
                Update existing records with new data
              </label>
            </div>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          {validationResults.slice(0, 10).map((result, index) => (
            <div key={index} className="border-b border-gray-100 p-3 last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {result.mappedData.name || 'No name'} ({result.mappedData.email || 'No email'})
                  </p>
                  {result.errors.length > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {result.errors.join(', ')}
                    </div>
                  )}
                  {result.warnings.length > 0 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {result.warnings.join(', ')}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {result.errors.length > 0 ? (
                    <ApperIcon name="X" size={16} className="text-red-500" />
                  ) : result.warnings.length > 0 ? (
                    <ApperIcon name="AlertTriangle" size={16} className="text-yellow-500" />
                  ) : (
                    <ApperIcon name="Check" size={16} className="text-green-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {validationResults.length > 10 && (
            <div className="p-3 text-center text-sm text-gray-500">
              ... and {validationResults.length - 10} more records
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Importing Leads</h3>
        <p className="text-gray-600">Please wait while we import your leads...</p>
      </div>

      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${importProgress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm text-gray-600">
          {importProgress}% Complete
        </div>
      </div>

      <div className="flex justify-center">
        <Loading />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Import Leads from CSV</h2>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber === step
                      ? 'bg-primary-600 text-white'
                      : stepNumber < step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber < step ? (
                    <ApperIcon name="Check" size={16} />
                  ) : (
                    stepNumber
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <ApperIcon name="X" size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isProcessing && step < 4 ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : (
            <>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {step > 1 && step < 4 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={isProcessing}
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              {step === 1 && (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!file || isProcessing}
                >
                  Next
                </Button>
              )}
              {step === 2 && (
                <Button
                  onClick={validateData}
                  disabled={isProcessing || Object.keys(columnMapping).length === 0}
                >
                  Validate Data
                </Button>
              )}
              {step === 3 && (
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || validationResults.filter(r => r.errors.length === 0).length === 0}
                >
                  Import Leads
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;