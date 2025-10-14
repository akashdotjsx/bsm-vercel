"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createGraphQLClient } from "@/lib/graphql/client"
import { gql } from "graphql-request"

// Query keys for React Query cache management
export const serviceCategoryKeys = {
  all: ["service-categories"] as const,
  lists: () => [...serviceCategoryKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...serviceCategoryKeys.lists(), filters] as const,
}

interface ServiceCategoryParams {
  organization_id?: string
  is_active?: boolean
}

// Fetch service categories with services
async function fetchServiceCategories(params: ServiceCategoryParams = {}) {
  const client = await createGraphQLClient()
  
  const query = gql`
    query GetServiceCategories {
      service_categoriesCollection(orderBy: [{ sort_order: AscNullsLast }, { name: AscNullsLast }]) {
        edges {
          node {
            id
            name
            description
            icon
            color
            sort_order
            is_active
            created_at
            updated_at
            servicesCollection {
              edges {
                node {
                  id
                  name
                  description
                  short_description
                  is_requestable
                  requires_approval
                  estimated_delivery_days
                  popularity_score
                  total_requests
                  status
                  created_at
                  updated_at
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await client.request(query)
  
  if (!data?.service_categoriesCollection?.edges) {
    return []
  }
  
  return data.service_categoriesCollection.edges.map((edge: any) => ({
    ...edge.node,
    services: edge.node.servicesCollection?.edges.map((serviceEdge: any) => serviceEdge.node) || []
  }))
}

// React Query hook for fetching categories
export function useServiceCategoriesQuery(params: ServiceCategoryParams = {}) {
  return useQuery({
    queryKey: serviceCategoryKeys.list(params),
    queryFn: () => fetchServiceCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Keep data visible during refetches to prevent UI breaking (React Query v5)
    placeholderData: (previousData) => previousData,
  })
}

// Create service category mutation
export function useCreateServiceCategoryMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryData: any) => {
      const client = await createGraphQLClient()
      const mutation = gql`
        mutation CreateServiceCategory($input: service_categoriesInsertInput!) {
          insertIntoservice_categoriesCollection(objects: [$input]) {
            records {
              id
              organization_id
              name
              description
              icon
              color
              is_active
              created_at
              updated_at
            }
          }
        }
      `
      const response = await client.request(mutation, { input: categoryData })
      return response.insertIntoservice_categoriesCollection.records[0]
    },
    onSuccess: () => {
      // Invalidate and refetch service categories
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
    onError: (error) => {
      console.error('Delete service error:', error)
    },
  })
}

// Create service mutation
export function useCreateServiceMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (serviceData: any) => {
      const client = await createGraphQLClient()
      const mutation = gql`
        mutation CreateService($input: servicesInsertInput!) {
          insertIntoservicesCollection(objects: [$input]) {
            records {
              id
              organization_id
              name
              description
              category_id
              estimated_delivery_days
              popularity_score
              is_requestable
              requires_approval
              status
              created_at
              updated_at
            }
          }
        }
      `
      const response = await client.request(mutation, { input: serviceData })
      return response.insertIntoservicesCollection.records[0]
    },
    onSuccess: () => {
      // Invalidate and refetch service categories (which includes services)
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
  })
}

// Update service mutation
export function useUpdateServiceMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const client = await createGraphQLClient()
      const mutation = gql`
        mutation UpdateService($id: UUID!, $input: servicesUpdateInput!) {
          updateservicesCollection(filter: { id: { eq: $id } }, set: $input) {
            records {
              id
              organization_id
              name
              description
              category_id
              estimated_delivery_days
              popularity_score
              is_requestable
              requires_approval
              status
              created_at
              updated_at
            }
          }
        }
      `
      const response = await client.request(mutation, { id, input: updateData })
      return response.updateservicesCollection.records[0]
    },
    onSuccess: () => {
      // Use a more targeted invalidation to prevent UI breaking
      queryClient.invalidateQueries({ 
        queryKey: serviceCategoryKeys.all,
        refetchType: 'active' // Only refetch active queries
      })
    },
  })
}

// Delete service mutation
export function useDeleteServiceMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const client = await createGraphQLClient()
      
      console.log('🗑️ Starting DELETE SERVICE for ID:', id)
      
      // First, get all service requests for this service
      const getRequestsQuery = gql`
        query GetServiceRequests($serviceId: UUID!) {
          service_requestsCollection(filter: { service_id: { eq: $serviceId } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `
      
      const requestsResponse: any = await client.request(getRequestsQuery, { serviceId: id })
      const serviceRequests = requestsResponse?.service_requestsCollection?.edges || []
      
      console.log(`📋 Found ${serviceRequests.length} service requests to delete`)
      
      // STEP 1: Delete service request approvals FIRST
      for (const requestEdge of serviceRequests) {
        const requestId = requestEdge.node.id
        
        console.log(`  🔄 Deleting approvals for request: ${requestId}`)
        
        const deleteApprovalsMutation = gql`
          mutation DeleteServiceRequestApprovals($requestId: UUID!) {
            deleteFromservice_request_approvalsCollection(filter: { service_request_id: { eq: $requestId } }) {
              affectedCount
            }
          }
        `
        try {
          const approvalsResult: any = await client.request(deleteApprovalsMutation, { requestId })
          console.log(`  ✅ Deleted ${approvalsResult.deleteFromservice_request_approvalsCollection.affectedCount} approvals`)
        } catch (error) {
          console.log(`  ⚠️ No approvals to delete for request: ${requestId}`)
        }
      }
      
      // STEP 2: Delete service requests ONE BY ONE (more reliable than batch delete)
      if (serviceRequests.length > 0) {
        console.log(`  🔄 Deleting ${serviceRequests.length} service requests ONE BY ONE`)
        
        let deletedCount = 0
        for (const requestEdge of serviceRequests) {
          const requestId = requestEdge.node.id
          
          console.log(`    🔄 Deleting service request: ${requestId}`)
          
          const deleteRequestMutation = gql`
            mutation DeleteServiceRequest($requestId: UUID!) {
              deleteFromservice_requestsCollection(filter: { id: { eq: $requestId } }) {
                affectedCount
              }
            }
          `
          try {
            const result: any = await client.request(deleteRequestMutation, { requestId })
            const affected = result.deleteFromservice_requestsCollection.affectedCount
            console.log(`    ✅ Deleted service request (affected: ${affected})`)
            deletedCount += affected
          } catch (error: any) {
            console.error(`    ❌ Error deleting service request ${requestId}:`, error.message || error)
            throw new Error(`Failed to delete service request ${requestId}: ${error.message || 'Unknown error'}`)
          }
        }
        
        console.log(`  ✅ Deleted ${deletedCount} service requests total`)
        
        // VERIFY deletion
        console.log(`  🔍 Verifying all service requests are deleted...`)
        const verifyResult: any = await client.request(getRequestsQuery, { serviceId: id })
        const remainingRequests = verifyResult.service_requestsCollection?.edges || []
        
        if (remainingRequests.length > 0) {
          console.error(`  ❌ CRITICAL: ${remainingRequests.length} service requests still exist!`)
          console.error(`  Remaining request IDs:`, remainingRequests.map((e: any) => e.node.id))
          throw new Error(`Failed to delete all service requests for service ${id}. ${remainingRequests.length} requests still remain.`)
        }
        console.log(`  ✅ Verified: All service requests deleted`)
      }
      
      // STEP 3: Delete the service
      console.log(`  🔄 Deleting service ${id}...`)
      const deleteServiceMutation = gql`
        mutation DeleteService($id: UUID!) {
          deleteFromservicesCollection(filter: { id: { eq: $id } }) {
            affectedCount
          }
        }
      `
      try {
        await client.request(deleteServiceMutation, { id })
        console.log(`  ✅ Service deleted successfully!`)
      } catch (error: any) {
        console.error(`  ❌ Error deleting service:`, error)
        throw error
      }
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: serviceCategoryKeys.all })
      
      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(serviceCategoryKeys.all)
      
      // Optimistically update the cache
      queryClient.setQueryData(serviceCategoryKeys.all, (old: any) => {
        if (!old) return old
        
        return old.map((category: any) => ({
          ...category,
          services: category.services.filter((service: any) => service.id !== deletedId)
        }))
      })
      
      return { previousCategories }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCategories) {
        queryClient.setQueryData(serviceCategoryKeys.all, context.previousCategories)
      }
      console.error('Delete service error:', err)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
  })
}

// Update service category mutation
export function useUpdateServiceCategoryMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const client = await createGraphQLClient()
      const mutation = gql`
        mutation UpdateServiceCategory($id: UUID!, $input: service_categoriesUpdateInput!) {
          updateservice_categoriesCollection(filter: { id: { eq: $id } }, set: $input) {
            records {
              id
              organization_id
              name
              description
              icon
              color
              is_active
              created_at
              updated_at
            }
          }
        }
      `
      const response = await client.request(mutation, { id, input: updateData })
      return response.updateservice_categoriesCollection.records[0]
    },
    onSuccess: () => {
      // Use a more targeted invalidation to prevent UI breaking
      queryClient.invalidateQueries({ 
        queryKey: serviceCategoryKeys.all,
        refetchType: 'active' // Only refetch active queries
      })
    },
  })
}

// Delete service category mutation
export function useDeleteServiceCategoryMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const client = await createGraphQLClient()
      
      // First, get all services in this category
      const getServicesQuery = gql`
        query GetServicesInCategory($categoryId: UUID!) {
          servicesCollection(filter: { category_id: { eq: $categoryId } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `
      
      const servicesResponse = await client.request(getServicesQuery, { categoryId: id })
      const services = servicesResponse.servicesCollection?.edges?.map((edge: any) => edge.node) || []
      
      console.log(`🗑️ Deleting category with ${services.length} services...`)
      
      // Delete all services in this category first (which will also delete their service requests)
      for (const service of services) {
        console.log(`  🔄 Processing service: ${service.id}`)
        
        // Get all service requests for this service
        const getRequestsQuery = gql`
          query GetServiceRequests($serviceId: UUID!) {
            service_requestsCollection(filter: { service_id: { eq: $serviceId } }) {
              edges {
                node {
                  id
                }
              }
            }
          }
        `
        
        const requestsResponse: any = await client.request(getRequestsQuery, { serviceId: service.id })
        const serviceRequests = requestsResponse?.service_requestsCollection?.edges || []
        
        console.log(`    📋 Found ${serviceRequests.length} service requests`)
        
        // Delete service request approvals FIRST
        for (const requestEdge of serviceRequests) {
          const requestId = requestEdge.node.id
          
          console.log(`    🔄 Deleting approvals for request: ${requestId}`)
          
          const deleteApprovalsMutation = gql`
            mutation DeleteServiceRequestApprovals($requestId: UUID!) {
              deleteFromservice_request_approvalsCollection(filter: { service_request_id: { eq: $requestId } }) {
                affectedCount
              }
            }
          `
          try {
            await client.request(deleteApprovalsMutation, { requestId })
            console.log(`    ✅ Deleted approvals`)
          } catch (error) {
            console.log(`    ⚠️ No approvals to delete`)
          }
        }
        
        // Then delete service requests ONE BY ONE
        if (serviceRequests.length > 0) {
          console.log(`    🔄 Deleting ${serviceRequests.length} service requests ONE BY ONE`)
          
          let deletedCount = 0
          for (const requestEdge of serviceRequests) {
            const requestId = requestEdge.node.id
            
            console.log(`      🔄 Deleting service request: ${requestId}`)
            
            const deleteRequestMutation = gql`
              mutation DeleteServiceRequest($requestId: UUID!) {
                deleteFromservice_requestsCollection(filter: { id: { eq: $requestId } }) {
                  affectedCount
                }
              }
            `
            try {
              const result: any = await client.request(deleteRequestMutation, { requestId })
              const affected = result.deleteFromservice_requestsCollection.affectedCount
              console.log(`      ✅ Deleted service request (affected: ${affected})`)
              deletedCount += affected
            } catch (error: any) {
              console.error(`      ❌ Error deleting service request ${requestId}:`, error.message || error)
              throw new Error(`Failed to delete service request ${requestId}: ${error.message || 'Unknown error'}`)
            }
          }
          
          console.log(`    ✅ Deleted ${deletedCount} service requests total`)
          
          // Verify deletion
          const verifyRequestsQuery = gql`
            query VerifyServiceRequests($serviceId: UUID!) {
              service_requestsCollection(filter: { service_id: { eq: $serviceId } }) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `
          const verifyResult: any = await client.request(verifyRequestsQuery, { serviceId: service.id })
          const remainingRequests = verifyResult.service_requestsCollection?.edges || []
          
          if (remainingRequests.length > 0) {
            console.error(`    ⚠️ CRITICAL: ${remainingRequests.length} service requests still exist after deletion!`)
            console.error(`    Remaining request IDs:`, remainingRequests.map((e: any) => e.node.id))
            throw new Error(`Failed to delete all service requests for service ${service.id}. ${remainingRequests.length} requests still remain.`)
          } else {
            console.log(`    ✅ Verified: All service requests deleted`)
          }
        } else {
          console.log(`    ℹ️ No service requests to delete`)
        }
        
        // Finally delete the service
        console.log(`    🔄 Deleting service...`)
        
        const deleteServiceMutation = gql`
          mutation DeleteService($serviceId: UUID!) {
            deleteFromservicesCollection(filter: { id: { eq: $serviceId } }) {
              affectedCount
            }
          }
        `
        try {
          await client.request(deleteServiceMutation, { serviceId: service.id })
          console.log(`    ✅ Service deleted`)
        } catch (error) {
          console.error(`    ❌ Error deleting service:`, error)
          throw error
        }
      }
      
      console.log(`  ✅ All ${services.length} services deleted`)
      
      // Finally, delete the category
      const deleteCategoryMutation = gql`
        mutation DeleteServiceCategory($id: UUID!) {
          deleteFromservice_categoriesCollection(filter: { id: { eq: $id } }) {
            affectedCount
          }
        }
      `
      await client.request(deleteCategoryMutation, { id })
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: serviceCategoryKeys.all })
      
      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(serviceCategoryKeys.all)
      
      // Optimistically update the cache
      queryClient.setQueryData(serviceCategoryKeys.all, (old: any) => {
        if (!old) return old
        
        return old.filter((category: any) => category.id !== deletedId)
      })
      
      return { previousCategories }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCategories) {
        queryClient.setQueryData(serviceCategoryKeys.all, context.previousCategories)
      }
      console.error('Delete service category error:', err)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
  })
}
