/**
 * SQL Service
 * Handles SQL query execution through the WebSocket connection
 * Provides compatibility with the old executeSQLQueryWithCallback function
 */

import socketService from './socket.service'
import { NodeEvent } from '@/modules/shared/shared'

// SQL Settings interface matching the old system
interface SQLSettings {
  array?: boolean          // Return rows as arrays instead of objects
  cacheuser?: boolean      // Cache at user level
  cachesystem?: boolean    // Cache at system level
  sensitivecontent?: boolean // Contains sensitive data like passwords
}

// SQL Result interfaces matching the old system
interface SQLColumn {
  typename: string
  dataLength: number | undefined
  colname: string
  colid?: number
}

interface SQLResultTable {
  columns: SQLColumn[]
  rows: any[]
}

interface SQLResult {
  Path?: string
  tables: SQLResultTable[]
  QueryMs: number
  ConnId: number
  WasQueued: boolean
  TotalMs?: number
  TableCount?: number
}

class SQLService {
  /**
   * Execute SQL query with callback (Promise-based)
   * Maintains compatibility with the old executeSQLQueryWithCallback function
   */
  async executeSQLQueryWithCallback(
    path: string,
    data: any = {},
    settings: SQLSettings = {}
  ): Promise<any> {
    try {
      // Send the SQL request through the socket service
      const response = await socketService.sendRequest(NodeEvent.Api, {
        path,
        data,
        settings
      })

      // Check if we have a valid SQL response
      if (response.ApiResp) {
        const sqlResult = response.ApiResp

        // If array setting is true and we have tables, return just the rows of the first table
        if (settings.array && sqlResult.tables && sqlResult.tables.length > 0) {
          return sqlResult.tables[0].rows
        }

        // Otherwise return the full SQL result
        return sqlResult
      }

      // If no ApiResp, throw error
      throw new Error('Invalid SQL response format')
    } catch (error) {
      console.error('SQL query execution failed:', error)
      throw error
    }
  }

  /**
   * Execute SQL query (simplified version)
   * Returns the first table's rows directly
   */
  async query(path: string, data: any = {}, settings: SQLSettings = {}): Promise<any[]> {
    const result = await this.executeSQLQueryWithCallback(path, data, { ...settings, array: true })
    return result || []
  }

  /**
   * Execute SQL query and get full result
   * Returns the complete SQL result including metadata
   */
  async queryFull(path: string, data: any = {}, settings: SQLSettings = {}): Promise<SQLResult> {
    return await this.executeSQLQueryWithCallback(path, data, settings)
  }

  /**
   * Execute SQL command (insert, update, delete)
   * Returns success status
   */
  async execute(path: string, data: any = {}, settings: SQLSettings = {}): Promise<boolean> {
    try {
      await this.executeSQLQueryWithCallback(path, data, settings)
      return true
    } catch (error) {
      console.error('SQL command execution failed:', error)
      return false
    }
  }
}

// Export a singleton instance
const sqlService = new SQLService()

// Export both the service instance and the compatibility function
export default sqlService

// Global function for backward compatibility
export function executeSQLQueryWithCallback(
  path: string,
  data?: any,
  settings?: SQLSettings
): Promise<any> {
  return sqlService.executeSQLQueryWithCallback(path, data, settings)
}