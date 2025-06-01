/**
 * SQL Composable
 * Provides SQL query functionality to Vue components
 */

import { executeSQLQueryWithCallback } from '@/services/sql.service'

export function useSQL() {
  return {
    executeSQLQueryWithCallback
  }
}