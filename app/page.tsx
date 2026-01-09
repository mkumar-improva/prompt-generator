'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'results'>('data');

  const applyFilters = useCallback(() => {
    let filtered = [...excelData];
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    setFilteredData(filtered);
  }, [excelData, filters]);

  useEffect(() => {
    fetchTemplates();
    fetchLatestData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
    if (!templateName.trim() || !currentTemplate.trim()) {
      alert('Please provide both template name and content');
      return;
    }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Modern Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Prompt Generator</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered prompt generation from Excel data</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTemplateEditor(!showTemplateEditor)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {showTemplateEditor ? 'Hide' : 'Show'} Templates
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Data</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload your Excel file to begin</p>
              </div>
              {filename && (
                <div className="flex items-center space-x-2 text-sm">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{filename}</span>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-900 dark:text-gray-100
                  file:mr-4 file:py-2.5 file:px-6
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-gradient-to-r file:from-blue-600 file:to-purple-600
                  file:text-white
                  hover:file:from-blue-700 hover:file:to-purple-700
                  file:cursor-pointer file:transition
                  cursor-pointer
                  bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-3"
              />
            </div>
          </div>
        </div>

        {/* Template Editor Modal/Section */}
        {showTemplateEditor && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prompt Templates</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage your prompt templates</p>
                </div>
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter template name"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Content
                </label>
                <textarea
                  value={currentTemplate}
                  onChange={(e) => setCurrentTemplate(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  placeholder="Enter your template. Use {{data}} for all row data or {{columnName}} for specific columns."
                />
                <div className="mt-2 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Use <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{'{{data}}'}</code> for all row data or 
                    <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-1">{'{{columnName}}'}</code> for specific columns
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setIsEditingTemplate(true);
                    handleSaveTemplate();
                  }}
                  disabled={!templateName.trim() || !currentTemplate.trim()}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Update Template
                </button>
                <button
                  onClick={() => {
                    setIsEditingTemplate(false);
                    handleSaveTemplate();
                  }}
                  disabled={!templateName.trim() || !currentTemplate.trim()}
                  className="inline-flex items-center px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Save as New
                </button>
                <button
                  onClick={() => {
                    setIsEditingTemplate(false);
                    setTemplateName('');
                    setCurrentTemplate('');
                  }}
                  className="inline-flex items-center px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {excelData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Data Table */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Table</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filteredData.length} of {excelData.length} rows</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        activeTab === 'data'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      View Data
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {columns.slice(0, 4).map((column) => (
                      <div key={column}>
                        <input
                          type="text"
                          value={filters[column] || ''}
                          onChange={(e) => handleFilterChange(column, e.target.value)}
                          placeholder={`Filter by ${column}...`}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column}
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                          {columns.map((column) => (
                            <td
                              key={column}
                              className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap"
                            >
                              {String(row[column])}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                handleGeneratePrompt(row, index);
                                setActiveTab('results');
                              }}
                              disabled={loading}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105"
                            >
                              {loading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Generate
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 sticky top-24">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Response</h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generated prompts and responses</p>
                </div>

                <div className="p-6">
                  {generatedPrompt ? (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prompt (Row {generatedPrompt.rowIndex + 1})</h3>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {generatedPrompt.prompt}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Response</h3>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {generatedPrompt.generatedText}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPrompt.generatedText);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Response
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Click "Generate" on any row to create a prompt
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {excelData.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Upload an Excel file to start generating AI-powered prompts from your data
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 dark:text-gray-600">
                <span>Supports</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono">.xlsx</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono">.xls</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
