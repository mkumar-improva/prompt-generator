'use client';

import { useState, useEffect } from 'react';

interface RowData {
  [key: string]: string | number;
}

interface Template {
  id: number;
  name: string;
  template: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [excelData, setExcelData] = useState<RowData[]>([]);
  const [filteredData, setFilteredData] = useState<RowData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<{
    prompt: string;
    generatedText: string;
    rowIndex: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchLatestData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [excelData, filters]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates);
      if (data.templates.length > 0) {
        setSelectedTemplate(data.templates[0].id);
        setCurrentTemplate(data.templates[0].template);
        setTemplateName(data.templates[0].name);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLatestData = async () => {
    try {
      const response = await fetch('/api/upload');
      const result = await response.json();
      if (result.data) {
        setExcelData(result.data);
        setFilename(result.filename);
        if (result.data.length > 0) {
          setColumns(Object.keys(result.data[0]));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setExcelData(result.data);
        setFilename(file.name);
        if (result.data.length > 0) {
          setColumns(Object.keys(result.data[0]));
        }
        setFilters({});
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...excelData];
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    setFilteredData(filtered);
  };

  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleGeneratePrompt = async (row: RowData, index: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowData: row,
          templateId: selectedTemplate,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedPrompt({
          prompt: result.prompt,
          generatedText: result.generatedText,
          rowIndex: index,
        });
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const method = isEditingTemplate ? 'PUT' : 'POST';
      const body = isEditingTemplate
        ? { id: selectedTemplate, name: templateName, template: currentTemplate }
        : { name: templateName, template: currentTemplate };

      const response = await fetch('/api/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchTemplates();
        setIsEditingTemplate(false);
        alert('Template saved successfully!');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleTemplateChange = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSelectedTemplate(id);
      setCurrentTemplate(template.template);
      setTemplateName(template.name);
      setIsEditingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900 dark:text-indigo-300">
          📊 Prompt Generator
        </h1>

        {/* File Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Upload Excel File
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
            />
            {filename && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current: {filename}
              </span>
            )}
          </div>
        </div>

        {/* Template Editor Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Prompt Template Editor
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Template Content
              </label>
              <textarea
                value={currentTemplate}
                onChange={(e) => setCurrentTemplate(e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your template. Use {{data}} for all row data or {{columnName}} for specific columns."
              />
              <p className="text-xs text-gray-500 mt-2">
                Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{data}}'}</code> for all row data or{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{columnName}}'}</code> for specific columns
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditingTemplate(true);
                  handleSaveTemplate();
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Update Template
              </button>
              <button
                onClick={() => {
                  setIsEditingTemplate(false);
                  setTemplateName('');
                  setCurrentTemplate('');
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Create New Template
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        {excelData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Data Table ({filteredData.length} rows)
            </h2>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {columns.map((column) => (
                <div key={column}>
                  <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                    Filter {column}
                  </label>
                  <input
                    type="text"
                    value={filters[column] || ''}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                    placeholder={`Filter by ${column}`}
                    className="w-full p-2 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300"
                        >
                          {String(row[column])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleGeneratePrompt(row, index)}
                          disabled={loading}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
                        >
                          {loading ? 'Generating...' : 'Generate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generated Prompt Display */}
        {generatedPrompt && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Generated Output (Row {generatedPrompt.rowIndex + 1})
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Formatted Prompt:
                </h3>
                <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {generatedPrompt.prompt}
                  </pre>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  AI Generated Response:
                </h3>
                <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg border border-green-200 dark:border-gray-600">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {generatedPrompt.generatedText}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {excelData.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Upload an Excel file to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
