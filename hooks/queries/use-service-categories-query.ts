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
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
  })
}

// Delete service mutation
export function useDeleteServiceMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const client = await createGraphQLClient()
      const mutation = gql`
        mutation DeleteService($id: UUID!) {
          deleteservicesCollection(filter: { id: { eq: $id } }) {
            records {
              id
            }
          }
        }
      `
      await client.request(mutation, { id })
    },
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
  })
}

// Delete service category mutation
export function useDeleteServiceCategoryMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const client = await createGraphQLClient()
      const mutation = gql`
        mutation DeleteServiceCategory($id: UUID!) {
          deleteservice_categoriesCollection(filter: { id: { eq: $id } }) {
            records {
              id
            }
          }
        }
      `
      await client.request(mutation, { id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
    },
  })
}
