import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CustomColumn } from '@/lib/stores/custom-columns-store'

// Custom hook for custom columns
export function useCustomColumnsGraphQL(organizationId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get custom columns
  const { data: columns = [], isLoading, error } = useQuery({
    queryKey: ['custom-columns', organizationId],
    queryFn: async () => {
      console.log('🔍 Fetching custom columns for organization_id:', organizationId)
      
      const { data, error } = await supabase
        .from('custom_columns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching custom columns:', error)
        throw error
      }
      
      console.log('✅ Fetched custom columns:', data)
      return data || []
    },
    enabled: !!organizationId && organizationId.length > 0
  })

  // Create custom column mutation
  const createColumnMutation = useMutation({
    mutationFn: async (column: Omit<CustomColumn, 'id'>) => {
      console.log('🚀 Creating custom column:', column)
      console.log('🔍 Organization ID:', organizationId)

      const { data: userData } = await supabase.auth.getUser()
      
      if (!userData.user?.id) {
        throw new Error('User not authenticated')
      }

      console.log('👤 User ID:', userData.user.id)
      
      // First, create the custom column
      const { data: newColumn, error: columnError } = await supabase
        .from('custom_columns')
        .insert({
          organization_id: organizationId,
          user_id: userData.user.id,
          title: column.title,
          type: column.type,
          options: column.options || [],
          default_value: column.defaultValue,
          visible: column.visible !== false,
          sort_order: 0
        })
        .select()
        .single()

      if (columnError) {
        console.error('❌ Error creating custom column:', columnError)
        throw columnError
      }

      console.log('✅ Custom column created:', newColumn)

      // Then, add this column to all existing tickets in the organization
      const { data: ticketsCount, error: functionError } = await supabase
        .rpc('add_custom_column_to_all_tickets', {
          p_column_id: newColumn.id,
          p_organization_id: organizationId,
          p_default_value: column.defaultValue ? JSON.parse(column.defaultValue) : null
        })

      if (functionError) {
        console.error('Error adding column to existing tickets:', functionError)
        // Don't throw here - the column was created successfully
      } else {
        console.log(`✅ Added custom column to ${ticketsCount} existing tickets`)
      }

      return newColumn
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-columns', organizationId] })
    }
  })

  // Update custom column mutation
  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomColumn> }) => {
      const { data, error } = await supabase
        .from('custom_columns')
        .update({
          title: updates.title,
          type: updates.type,
          options: updates.options,
          default_value: updates.defaultValue,
          visible: updates.visible,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-columns', organizationId] })
    }
  })

  // Delete custom column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('custom_columns')
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-columns', organizationId] })
    }
  })

  return {
    columns,
    isLoading,
    error,
    createColumn: createColumnMutation.mutateAsync,
    updateColumn: updateColumnMutation.mutateAsync,
    deleteColumn: deleteColumnMutation.mutateAsync,
    isCreating: createColumnMutation.isPending,
    isUpdating: updateColumnMutation.isPending,
    isDeleting: deleteColumnMutation.isPending
  }
}

// Custom hook for custom column values
export function useCustomColumnValuesGraphQL(ticketId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get custom column values for a ticket
  const { data: values = [], isLoading, error } = useQuery({
    queryKey: ['custom-column-values', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_column_values')
        .select('*')
        .eq('ticket_id', ticketId)

      if (error) throw error
      return data || []
    },
    enabled: !!ticketId
  })

  // Set custom column value mutation
  const setValueMutation = useMutation({
    mutationFn: async ({ columnId, value, organizationId }: { 
      columnId: string; 
      value: any; 
      organizationId: string;
    }) => {
      const { data, error } = await supabase
        .from('custom_column_values')
        .upsert({
          organization_id: organizationId,
          ticket_id: ticketId,
          column_id: columnId,
          value: value,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-column-values', ticketId] })
    }
  })

  return {
    values,
    isLoading,
    error,
    setValue: setValueMutation.mutateAsync,
    isSetting: setValueMutation.isPending
  }
}
