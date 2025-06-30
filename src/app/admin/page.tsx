'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function AdminDashboard() {
  const { status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [models] = useState<string[]>([
    'users', 'memes', 'votes', 'tags', 'categories', 
    'followers', 'milestones', 'notifications', 'referrals', 'apilogs', 'mintlogs'
  ])

  // Fetch data from admin API
  const fetchData = async (model: string = '') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const url = model ? `/api/admin?model=${model}` : '/api/admin'
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
    fetchData(model)
  }

  // Check authentication and admin status on component mount
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    // Initial data fetch
    fetchData()
  }, [status, router])

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
                fetchData(key.toLowerCase())
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header === '_id' ? 'ID' : header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
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
                          href={`https://amoy.polygonscan.com/tx/${item[header]}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header === '_id' ? 'ID' : header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
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
          {selectedModel ? (
            <>
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {selectedModel} Data
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