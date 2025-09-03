'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function AdminDashboard() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [models] = useState<string[]>([
    'users', 'memes', 'votes', 'tags', 'categories', 
    'followers', 'milestones', 'notifications', 'referrals', 'apilogs', 'mintlogs', 'reports'
  ])
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null)

  // Fetch data from admin API
  const fetchData = async (model: string = '', sortKey: string = '', sortDirection: string = '') => {
    setIsLoading(true)
    setError(null)
    
    try {
      let url = model ? `/api/admin?model=${model}` : '/api/admin'
      
      // Add sorting parameters if provided
      if (sortKey && sortDirection) {
        url += `&sortKey=${sortKey}&sortDirection=${sortDirection}`
      }
      
      const response = await axios.get(url)
      setData(response.data.data)
    } catch (err: any) {
      console.error('Error fetching admin data:', err)
      if (err.response?.status === 403) {
        setError('You do not have admin privileges.')
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in.')
        router.push('/') // Redirect to login page
      } else {
        setError('An error occurred while fetching data.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle model selection change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value
    setSelectedModel(model)
    setSortConfig(null) // Reset sorting when changing models
    fetchData(model)
    
    // Update URL to reflect the current model
    if (model) {
      router.push(`/admin?model=${model}`)
    } else {
      router.push('/admin')
    }
  }

  // Handle direct model selection
  const selectModel = (model: string) => {
    setSelectedModel(model)
    setSortConfig(null) // Reset sorting when changing models
    fetchData(model)
    router.push(`/admin?model=${model}`)
  }

  // Handle column sort
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    fetchData(selectedModel, key, direction);
  }

  // Get sort direction icon
  const getSortDirectionIcon = (header: string) => {
    if (!sortConfig || sortConfig.key !== header) {
      return '⇅';
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  }

  // Handle report actions (delete meme or dismiss report)
  const handleReportAction = async (reportId: string, action: 'delete_meme' | 'dismiss_report') => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/report/admin-action', {
        reportId,
        action
      })
      
      if (response.status === 200) {
        // Refresh the reports data
        fetchData(selectedModel)
        alert(response.data.message)
      }
    } catch (error: any) {
      console.error('Error handling report action:', error)
      alert('Error: ' + (error.response?.data?.error || 'Something went wrong'))
    } finally {
      setIsLoading(false)
    }
  }

  // Check authentication and admin status on component mount
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    // Check for model in URL query params
    const modelFromUrl = searchParams.get('model')
    if (modelFromUrl && models.includes(modelFromUrl)) {
      setSelectedModel(modelFromUrl)
      fetchData(modelFromUrl)
    } else {
      // Initial data fetch
      fetchData()
    }
  }, [status, router, searchParams, models])

  // Render loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  // Render data overview (counts)
  const renderOverview = () => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 ">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold capitalize">{key}</h3>
            <p className="text-3xl font-bold text-blue-600">{value as number}</p>
            <button 
              onClick={() => {
                setSelectedModel(key.toLowerCase())
                setSortConfig(null) // Reset sorting when changing models
                fetchData(key.toLowerCase())
                router.push(`/admin?model=${key.toLowerCase()}`)
              }}
              className="mt-2 text-sm text-blue-500 hover:text-blue-700"
            >
              View details
            </button>
          </div>
        ))}
      </div>
    )
  }

  // Special formatter for mint logs
  const formatMintLogValue = (key: string, value: any): string => {
    if (key === 'status') {
      const statusColors = {
        pending: '🟠',
        success: '🟢',
        failed: '🔴'
      };
      return `${statusColors[value as keyof typeof statusColors] || ''} ${value}`;
    }
    
    if (key === 'reason') {
      return value.replace(/_/g, ' ');
    }
    
    if (key === 'amount') {
      return `${value} tokens`;
    }
    
    if (key === 'transactionHash' && value) {
      return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
    }
    
    if (key === 'recipient') {
      return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
    }
    
    return renderCellValue(value);
  }

  // Render data table for specific model
  const renderTable = () => {
    if (!data || !Array.isArray(data)) return null
    
    if (data.length === 0) {
      return <p className="text-gray-500 italic">No records found.</p>
    }
    
    // Get table headers from first item's keys
    const firstItem = data[0]
    const headers = Object.keys(firstItem).filter(key => 
      // Filter out mongoose's internal fields
      !['__v'].includes(key) && 
      // Only show first level of populated fields
      (typeof firstItem[key] !== 'object' || key === '_id' || Array.isArray(firstItem[key]))
    )
    
    // For reports, show specific columns and actions
    if (selectedModel === 'reports') {
      const priorityHeaders = ['createdAt', 'meme', 'reported_by', 'reason', 'status', 'admin_action'];
      const filteredHeaders = headers.filter(h => 
        priorityHeaders.includes(h) || !['__v', 'updatedAt', 'resolved_at'].includes(h)
      );
      
      // Sort headers to match priority order
      const sortedHeaders = [...priorityHeaders].filter(h => filteredHeaders.includes(h));
      
      // Add any remaining headers not in the priority list
      filteredHeaders.forEach(h => {
        if (!sortedHeaders.includes(h)) {
          sortedHeaders.push(h);
        }
      });
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {sortedHeaders.map(header => (
                  <th 
                    key={header} 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                    onClick={() => requestSort(header)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{header === '_id' ? 'ID' : header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
                      <span className="ml-1">{getSortDirectionIcon(header)}</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: any, index: number) => (
                <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {sortedHeaders.map(header => (
                    <td key={`${item._id}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {header === 'meme' && item[header] ? (
                        <div>
                          <div className="font-medium">{item[header].name}</div>
                          <div className="text-xs text-gray-400">by {item[header].created_by?.username}</div>
                        </div>
                      ) : header === 'reported_by' && item[header] ? (
                        item[header].username
                      ) : header === 'status' ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item[header] === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          item[header] === 'resolved' ? 'bg-green-100 text-green-800' :
                          item[header] === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item[header]}
                        </span>
                      ) : header === 'reason' ? (
                        item[header].replace(/_/g, ' ')
                      ) : (
                        renderCellValue(item[header])
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.status === 'pending' && item.meme && !item.meme.is_deleted ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReportAction(item._id, 'delete_meme')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          Delete Meme
                        </button>
                        <button
                          onClick={() => handleReportAction(item._id, 'dismiss_report')}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {item.status === 'pending' && item.meme?.is_deleted ? 'Meme already deleted' : 'Already processed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // For mint logs, prioritize certain columns and exclude others
    if (selectedModel === 'mintlogs') {
      const priorityHeaders = ['createdAt', 'recipient', 'amount', 'reason', 'status', 'transactionHash'];
      const filteredHeaders = headers.filter(h => 
        priorityHeaders.includes(h) || !['tokenAmount', 'details', 'updatedAt', '__v'].includes(h)
      );
      
      // Sort headers to match priority order
      const sortedHeaders = [...priorityHeaders].filter(h => filteredHeaders.includes(h));
      
      // Add any remaining headers not in the priority list
      filteredHeaders.forEach(h => {
        if (!sortedHeaders.includes(h)) {
          sortedHeaders.push(h);
        }
      });
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {sortedHeaders.map(header => (
                  <th 
                    key={header} 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                    onClick={() => requestSort(header)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{header === '_id' ? 'ID' : header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
                      <span className="ml-1">{getSortDirectionIcon(header)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: any, index: number) => (
                <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {sortedHeaders.map(header => (
                    <td key={`${item._id}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {header === 'transactionHash' && item[header] ? (
                        <a 
                          href={`https://sepolia.arbiscan.io/tx/${item[header]}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {formatMintLogValue(header, item[header])}
                        </a>
                      ) : (
                        formatMintLogValue(header, item[header])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {headers.map(header => (
                <th 
                  key={header} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort(header)}
                >
                  <div className="flex items-center justify-between">
                    <span>{header === '_id' ? 'ID' : header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
                    <span className="ml-1">{getSortDirectionIcon(header)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item: any, index: number) => (
              <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map(header => (
                  <td key={`${item._id}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {renderCellValue(item[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Helper to render cell values based on type
  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    
    if (value instanceof Date) return value.toLocaleString()
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`
      }
      
      // Handle MongoDB ObjectId
      if (value._id) return value._id.toString()
      
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  // Render navigation breadcrumbs
  const renderBreadcrumbs = () => {
    return (
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
              </svg>
              Dashboard
            </Link>
          </li>
          {selectedModel && (
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-700 capitalize">{selectedModel}</span>
              </div>
            </li>
          )}
        </ol>
      </nav>
    )
  }

  // Render quick access navigation
  const renderQuickNav = () => {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2 text-gray-800">Quick Navigation</h3>
        <div className="flex flex-wrap gap-2">
          {models.map(model => (
            <button
              key={model}
              onClick={() => selectModel(model)}
              className={`px-3 py-1 rounded text-sm ${
                selectedModel === model 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="capitalize">{model}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-gray-300 shadow rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and view all database collections</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              >
                <option value="">Overview</option>
                {models.map(model => (
                  <option key={model} value={model} className="capitalize">
                    {model.charAt(0).toUpperCase() + model.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className="bg-gray-300 shadow rounded-lg p-6 text-green-500">
          {renderBreadcrumbs()}
          {renderQuickNav()}
          
          {selectedModel ? (
            <>
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {selectedModel} Data {sortConfig && <span className="text-sm font-normal">(Sorted by {sortConfig.key} {sortConfig.direction})</span>}
              </h2>
              {renderTable()}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4 text-black">Database Overview</h2>
              {renderOverview()}
            </>
          )}
        </main>
      </div>
    </div>
  )
} 