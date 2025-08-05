import React, { useCallback, useState } from "react";
import { AlertCircle, CheckCircle, Download, Upload, X } from "lucide-react";
import Papa from "papaparse";
import { toast } from "react-toastify";
import leadsService from "@/services/api/leadsService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import { Card } from "@/components/atoms/Card";

const CSVImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview, 4: Import
  const [errors, setErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);

  const requiredFields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'notes', label: 'Notes', required: false }
  ];

  const handleFileUpload = useCallback((event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setFile(uploadedFile);
    setIsUploading(true);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file');
          setErrors(results.errors);
          setIsUploading(false);
          return;
        }

        setCsvData(results.data);
        setStep(2);
        setIsUploading(false);
        
        // Auto-map common column names
        const headers = results.meta.fields;
        const autoMapping = {};
        
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          requiredFields.forEach(field => {
            if (lowerHeader.includes(field.key) || 
                lowerHeader === field.key ||
                (field.key === 'name' && (lowerHeader.includes('full') || lowerHeader.includes('first')))) {
              autoMapping[field.key] = header;
            }
          });
        });
        
        setColumnMapping(autoMapping);
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        setErrors([error]);
        setIsUploading(false);
      }
    });
  }, []);

  const handleColumnMappingChange = (fieldKey, csvColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: csvColumn
    }));
  };

  const generatePreview = () => {
    const preview = csvData.slice(0, 5).map(row => {
      const mappedRow = {};
      Object.entries(columnMapping).forEach(([fieldKey, csvColumn]) => {
        if (csvColumn && row[csvColumn] !== undefined) {
          mappedRow[fieldKey] = row[csvColumn];
        }
      });
      return mappedRow;
    });
    
    setPreviewData(preview);
    setStep(3);
  };

  const validateData = () => {
    const validationErrors = [];
    
    // Check required fields mapping
    const requiredFieldsNotMapped = requiredFields
      .filter(field => field.required && !columnMapping[field.key])
      .map(field => field.label);
    
    if (requiredFieldsNotMapped.length > 0) {
      validationErrors.push(`Required fields not mapped: ${requiredFieldsNotMapped.join(', ')}`);
    }

    // Check data quality
    const invalidRows = [];
    csvData.forEach((row, index) => {
      const mappedRow = {};
      Object.entries(columnMapping).forEach(([fieldKey, csvColumn]) => {
        if (csvColumn && row[csvColumn] !== undefined) {
          mappedRow[fieldKey] = row[csvColumn];
        }
      });

      // Validate email format if email is provided
      if (mappedRow.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedRow.email)) {
        invalidRows.push(`Row ${index + 1}: Invalid email format`);
      }

      // Check required fields have values
      requiredFields.forEach(field => {
        if (field.required && (!mappedRow[field.key] || mappedRow[field.key].trim() === '')) {
          invalidRows.push(`Row ${index + 1}: Missing ${field.label}`);
        }
      });
    });

    if (invalidRows.length > 0) {
      validationErrors.push(...invalidRows.slice(0, 10)); // Show first 10 errors
      if (invalidRows.length > 10) {
        validationErrors.push(`... and ${invalidRows.length - 10} more errors`);
      }
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleImport = async () => {
    if (!validateData()) {
      return;
    }

    setIsUploading(true);

    try {
      const leadsToImport = csvData.map(row => {
        const lead = {};
        Object.entries(columnMapping).forEach(([fieldKey, csvColumn]) => {
          if (csvColumn && row[csvColumn] !== undefined) {
            lead[fieldKey] = row[csvColumn].toString().trim();
          }
        });

        // Set defaults
        lead.status = lead.status || 'new';
        lead.source = lead.source || 'csv_import';
        lead.dateCreated = new Date().toISOString();
        lead.id = Date.now() + Math.random(); // Temporary ID

        return lead;
      });

      // Import leads via service
      const importedLeads = await leadsService.importLeads(leadsToImport);
      
      toast.success(`Successfully imported ${importedLeads.length} leads`);
      onImportComplete(importedLeads);
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import leads. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvData([]);
    setColumnMapping({});
    setStep(1);
    setErrors([]);
    setPreviewData([]);
    setIsUploading(false);
    onClose();
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        status: 'new',
        source: 'website',
        notes: 'Interested in our premium package'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Import Leads from CSV</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center ${stepNumber < 4 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle size={16} />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-gray-600">
            <span>Upload</span>
            <span>Map</span>
            <span>Preview</span>
            <span>Import</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload CSV File
                </h3>
                <p className="text-gray-600 mb-6">
                  Select a CSV file containing your leads data
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {file && (
                <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      {file.name} ({Math.round(file.size / 1024)}KB)
                    </span>
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Download size={16} className="mr-1" />
                  Download CSV Template
                </button>
              </div>

              {isUploading && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">Processing file...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Map CSV Columns
                </h3>
                <p className="text-gray-600">
                  Match your CSV columns to our lead fields
                </p>
              </div>

              <div className="grid gap-4">
                {requiredFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                    </div>
                    <div className="w-2/3">
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => handleColumnMappingChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select CSV Column</option>
                        {csvData.length > 0 &&
                          Object.keys(csvData[0]).map((column) => (
                            <option key={column} value={column}>
                              {column}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  onClick={generatePreview}
                  disabled={!columnMapping.name || !columnMapping.email}
                >
                  Generate Preview
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview Import Data
                </h3>
                <p className="text-gray-600">
                </p>
              </div>

              {previewData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {requiredFields.map((field) => (
                          <th
                            key={field.key}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {requiredFields.map((field) => (
                            <td
                              key={field.key}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row[field.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Import Summary
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Required fields mapped: {requiredFields.filter(f => f.required && columnMapping[f.key]).length}/{requiredFields.filter(f => f.required).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Back to Mapping
                </Button>
                <Button
                  onClick={() => setStep(4)}
                >
                  Continue to Import
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Import */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to Import
                </h3>
                <p className="text-gray-600">
                </p>
              </div>

              {errors.length > 0 && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Validation Errors
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc list-inside space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                >
                  Back to Preview
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isUploading || errors.length > 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </div>
                  ) : (
                    `Import ${csvData.length} Leads`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;