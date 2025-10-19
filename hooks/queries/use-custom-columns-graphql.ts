import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CustomColumn } from '@/lib/stores/custom-columns-store'

// Custom hook for custom columns
export function useCustomColumnsGraphQL(organizationId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get custom column definitions
  const { data: columns = [], isLoading, error } = useQuery({
    queryKey: ['custom-column-definitions', organizationId],
    queryFn: async () => {
      console.log('🔍 Fetching custom column definitions for organization_id:', organizationId)
      
      const { data, error } = await supabase
        .from('custom_column_definitions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching custom column definitions:', error)
        throw error
      }
      
      console.log('✅ Fetched custom column definitions:', data)
      return data || []
    },
    enabled: !!organizationId && organizationId.length > 0
  })

  // Create custom column mutation
  const createColumnMutation = useMutation({
    mutationFn: async (column: Omit<CustomColumn, 'id'>) => {
      console.log('🚀 Creating custom column definition:', column)
      console.log('🔍 Organization ID:', organizationId)

      const { data: userData } = await supabase.auth.getUser()
      
      if (!userData.user?.id) {
        throw new Error('User not authenticated')
      }

      console.log('👤 User ID:', userData.user.id)
      
      // First, create the custom column definition
      const { data: newColumn, error: columnError } = await supabase
        .from('custom_column_definitions')
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
        console.error('❌ Error creating custom column definition:', columnError)
        throw columnError
      }

      console.log('✅ Custom column definition created:', newColumn)

      // Then, add this column to all existing tickets in the organization using the new function
      const { data: ticketsCount, error: functionError } = await supabase
        .rpc('add_custom_column_to_tickets', {
          p_organization_id: organizationId,
          p_column_title: column.title,
          p_column_type: column.type,
          p_default_value: column.defaultValue
        })

      if (functionError) {
        console.error('Error adding column to existing tickets:', functionError)
        // Don't throw here - the column definition was created successfully
      } else {
        console.log(`✅ Added custom column to ${ticketsCount} existing tickets`)
      }

      return newColumn
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-column-definitions', organizationId] })
    }
  })

  // Update custom column mutation
  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomColumn> }) => {
      const { data, error } = await supabase
        .from('custom_column_definitions')
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
      queryClient.invalidateQueries({ queryKey: ['custom-column-definitions', organizationId] })
    }
  })

  // Delete custom column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the column definition to know the title
      const { data: columnData, error: fetchError } = await supabase
        .from('custom_column_definitions')
        .select('title')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Remove the column from all tickets
      const { error: removeError } = await supabase
        .rpc('remove_custom_column_from_tickets', {
          p_organization_id: organizationId,
          p_column_title: columnData.title
        })

      if (removeError) {
        console.error('Error removing column from tickets:', removeError)
        // Continue with deletion even if removal from tickets fails
      }

      // Delete the column definition
      const { data, error } = await supabase
        .from('custom_column_definitions')
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-column-definitions', organizationId] })
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

// Custom hook for custom column values (now stored in tickets.custom_fields)
export function useCustomColumnValuesGraphQL(ticketId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get custom field values from tickets table
  const { data: customFields = {}, isLoading, error } = useQuery({
    queryKey: ['ticket-custom-fields', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('custom_fields')
        .eq('id', ticketId)
        .single()

      if (error) throw error
      return data?.custom_fields || {}
    },
    enabled: !!ticketId
  })

  // Set custom field value mutation
  const setValueMutation = useMutation({
    mutationFn: async ({ fieldName, value }: { 
      fieldName: string; 
      value: any;
    }) => {
      console.log('🔄 setValueMutation called:', {
        ticketId,
        fieldName,
        value,
        valueType: typeof value
      })
      
      // Convert value to proper text format for the RPC function
      let textValue;
      if (value === null || value === undefined) {
        textValue = null;
      } else if (typeof value === 'string') {
        textValue = value; // Pass string as-is
      } else if (typeof value === 'number') {
        textValue = value.toString();
      } else if (typeof value === 'boolean') {
        textValue = value.toString();
      } else {
        textValue = JSON.stringify(value);
      }

      console.log('💾 Calling RPC with:', {
        p_ticket_id: ticketId,
        p_field_name: fieldName,
        p_field_value: textValue
      })

      const { data, error } = await supabase
        .rpc('update_ticket_custom_field', {
          p_ticket_id: ticketId,
          p_field_name: fieldName,
          p_field_value: textValue
        })

      if (error) {
        console.error('❌ RPC error:', error)
        throw error
      }
      
      console.log('✅ RPC success:', data)
      return data
    },
    onSuccess: () => {
      console.log('🔄 Invalidating cache for ticket:', ticketId)
      queryClient.invalidateQueries({ queryKey: ['ticket-custom-fields', ticketId] })
    }
  })

  return {
    customFields,
    isLoading,
    error,
    setValue: setValueMutation.mutateAsync,
    isSetting: setValueMutation.isPending
  }
}
