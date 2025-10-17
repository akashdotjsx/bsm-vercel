import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { categoryIconMap, getBgColorClass } from '@/lib/utils/icon-map'
import { Settings } from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  services: Service[]
}

interface Service {
  id: string
  name: string
  description: string
  estimated_delivery_days: number
  requires_approval: boolean
  status: string
  popularity_score: number
  total_requests: number
  category_name: string
  category_icon: string
  category_color: string
}

export function useServicesMCP() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Real data from Supabase MCP - all 12 categories with their services
      const realData = [
        {
          id: "00c8436f-463d-4a0b-bd6b-1840b3704ec3",
          name: "Facilities",
          description: "Building and office facilities management",
          icon: "Building",
          color: "#8B5CF6",
          is_active: true,
          services: [
            {
              id: "75991648-fd3f-4d9f-b717-7a5166fcb40e",
              name: "Desk Assignment",
              description: "Request desk or workspace assignment",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "9fe3a45f-6f75-42ba-8b3a-d03aa1c3b221",
              name: "Hi",
              description: "hello",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "46fc50b2-59b4-4f58-985d-e42ce011e7ab",
              name: "Key Card Access",
              description: "Request building access card",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "7d22935f-bdc5-4ab2-b275-083564d1bc20",
              name: "Maintenance Request",
              description: "Report facility maintenance issue",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "202118ef-971e-4eeb-bb48-680cf6344d85",
              name: "Meeting Room Booking",
              description: "Book conference or meeting room",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "3f2749da-3807-4682-9524-61f71b418007",
              name: "Parking Pass",
              description: "Request parking pass or permit",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "3ae732d0-ce3f-48f4-8a3d-0c64323cb629",
          name: "Finance Services",
          description: "Financial and accounting services",
          icon: "DollarSign",
          color: "#F59E0B",
          is_active: true,
          services: [
            {
              id: "3e6560a5-5030-4a0e-b962-d036e8058667",
              name: "Budget Request",
              description: "Request budget allocation",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "9778cd75-e263-4be8-a51d-9f43f63470d7",
              name: "Expense Reimbursement",
              description: "Submit expenses for reimbursement",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "54ff4781-17b9-4bdf-bde0-af68583ff42f",
              name: "Invoice Payment",
              description: "Process vendor invoice payment",
              estimated_delivery_days: 7,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "b8073b7f-100e-4507-9660-a8847f3bda29",
              name: "Purchase Order",
              description: "Create new purchase order",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "ed841cc2-39b2-4081-95cc-7a53b1f37bbb",
              name: "Travel Advance",
              description: "Request travel advance payment",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "977595eb-c393-4c06-b7f0-e3b932392058",
          name: "HR Services",
          description: "Human Resources and employee services",
          icon: "Users",
          color: "#10B981",
          is_active: true,
          services: [
            {
              id: "6e44026f-5602-4586-a167-6033bddbf354",
              name: "Benefits Enrollment",
              description: "Enroll in company benefits programs",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "56e7a236-9374-4664-a100-48cae79d99d4",
              name: "Employment Verification",
              description: "Request employment verification letter",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "8422ca96-2c7c-4438-9e83-8fe7c6c5a5c8",
              name: "Pay stub Request",
              description: "Request past pay stubs",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "7191257e-378a-442c-bb0b-76db8a51df5e",
              name: "Referral Bonus",
              description: "Submit employee referral",
              estimated_delivery_days: 7,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "a22474f1-4f09-41f1-b192-914093ce5dfe",
              name: "Time Off Request",
              description: "Request vacation or sick leave",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "21a2aaf1-e760-496c-acc5-7c4aafb13c80",
          name: "IT Services",
          description: "Information Technology support and services",
          icon: "Monitor",
          color: "#3B82F6",
          is_active: true,
          services: [
            {
              id: "df733c24-84af-46a0-b026-d3897f564538",
              name: "Hardware Repair",
              description: "Repair or replace faulty hardware",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "743aa7cb-c44e-45d1-ac04-8f136f87a3da",
              name: "New Employee Setup",
              description: "Set up new employee accounts and equipment",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "03f9c320-26ad-4bd7-ae1b-cbf03f58926c",
              name: "Password Reset",
              description: "Reset forgotten passwords",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "145c4b73-f324-42e8-99dd-0cea4fdb0fe3",
              name: "Software Installation",
              description: "Install approved software applications",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "40c818c7-2a4b-40fb-80dd-3a95a9c91ade",
              name: "VPN Access",
              description: "Set up remote VPN access",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "80cb80d3-3c1b-4e4a-be5f-f069c321ca36",
          name: "Legal Services",
          description: "Legal and compliance services",
          icon: "Scale",
          color: "#EF4444",
          is_active: true,
          services: [
            {
              id: "32d039f5-291a-408c-b80f-a4dcbe398396",
              name: "Compliance Review",
              description: "Compliance and regulatory review",
              estimated_delivery_days: 15,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "4b65224d-8c97-49f5-9de8-5414d8cbb9e1",
              name: "Contract Review",
              description: "Legal review of contracts",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "1032f94c-1492-4b7a-a0ac-84cb44ac5a5d",
              name: "Legal Consultation",
              description: "Schedule legal consultation",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "bfd5b556-9391-4e4f-8356-0db5862f8a95",
              name: "NDA Request",
              description: "Request Non-Disclosure Agreement",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "9b6b930d-0d4a-4c70-baef-39a365033d49",
          name: "Marketing",
          description: "Marketing and communications services",
          icon: "Megaphone",
          color: "#EC4899",
          is_active: true,
          services: [
            {
              id: "cc1784d1-0f65-408a-8920-82c69d335884",
              name: "Brand Guidelines",
              description: "Access brand guidelines and assets",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "1962952b-187b-45e1-8893-1d62cca4df63",
              name: "Event Support",
              description: "Marketing support for events",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "3e2a1d5e-3fdb-4a29-84b3-a24aa9585386",
              name: "Marketing Materials",
              description: "Request marketing collateral",
              estimated_delivery_days: 7,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "da9d2ac8-23bb-4465-a1ea-c4ca2c16c3d9",
              name: "Press Release",
              description: "Draft and publish press release",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "da9d3225-e333-4262-9065-0cf6eb11150f",
              name: "Social Media Post",
              description: "Request social media content",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "c1a0b6b3-acf5-4d15-886f-6230be4c0ba3",
          name: "Operations",
          description: "Business operations and process services",
          icon: "Settings",
          color: "#6366F1",
          is_active: true,
          services: [
            {
              id: "e04fcb96-2a95-4b22-ae28-52e0f00862e9",
              name: "Data Request",
              description: "Request operational data or report",
              estimated_delivery_days: 3,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "411ecb28-47b8-4538-8ad8-6c2d856e2f42",
              name: "Process Improvement",
              description: "Suggest process improvement",
              estimated_delivery_days: 15,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "ee3fe32c-364c-4166-895b-63a75d49aa2f",
              name: "Quality Issue",
              description: "Report quality or compliance issue",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "4462ce0c-c427-480c-9a85-d24d37f992d2",
              name: "SOP Documentation",
              description: "Create or update standard operating procedure",
              estimated_delivery_days: 15,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "40437676-f808-48f2-bbad-4cde0bae77c3",
              name: "Vendor Onboarding",
              description: "Onboard new vendor or supplier",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "4e8610f7-b94b-4695-a21a-a9c12072de9f",
          name: "Procurement",
          description: "Purchasing and vendor management",
          icon: "ShoppingCart",
          color: "#06B6D4",
          is_active: true,
          services: [
            {
              id: "a81606f7-53b5-4090-9f76-47fcedae5e4a",
              name: "Equipment Purchase",
              description: "Purchase new equipment",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "c2690825-a075-4f23-b4e7-d390fe2df176",
              name: "New Vendor Setup",
              description: "Set up new vendor in system",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "da81d2ae-2b3f-4c85-94a1-e970dfb4fc78",
              name: "Office Supplies",
              description: "Order office supplies",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "5b98acb2-9c1a-4df3-9e02-4f1dff1db934",
              name: "Software License",
              description: "Purchase software license",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "3f092678-29d3-4e35-9cbf-f3822c642b18",
              name: "Vendor Payment Terms",
              description: "Negotiate vendor payment terms",
              estimated_delivery_days: 15,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "eb8ec8a0-2490-4426-bca9-05caf73b0fb7",
          name: "Security",
          description: "Physical and information security",
          icon: "Shield",
          color: "#DC2626",
          is_active: true,
          services: [
            {
              id: "317c57df-fb97-4921-9d64-b88480d59b4d",
              name: "Access Request",
              description: "Request system access permissions",
              estimated_delivery_days: 2,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "e32d6f47-2632-4816-a12f-6d07fe6a7d37",
              name: "Badge Replacement",
              description: "Replace lost or damaged security badge",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "9dba4b06-3eea-4f98-8022-62dbe4a0a6eb",
              name: "Security Incident",
              description: "Report security incident",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "177e360c-8e35-4d3c-bd83-bfa93d384b54",
              name: "Security Training",
              description: "Complete security awareness training",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "bc43f31e-fb9c-4f61-8872-237acd110e39",
              name: "Visitor Badge",
              description: "Request visitor access badge",
              estimated_delivery_days: 1,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "1110ab27-8cc5-4f85-8e6a-0d5a79385cf0",
          name: "test",
          description: "",
          icon: "Settings",
          color: "bg-green-500",
          is_active: true,
          services: []
        },
        {
          id: "61a04236-f185-4dcb-8992-af659175261a",
          name: "Test category",
          description: "This is a test",
          icon: "Settings",
          color: "bg-purple-500",
          is_active: true,
          services: [
            {
              id: "f4b532d5-168a-48ac-9522-53c5da7672c0",
              name: "11",
              description: "12121",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "78dc2fe4-8d42-4266-9aa1-a4d85a8cc9fb",
              name: "Test b1234",
              description: "This is a test",
              estimated_delivery_days: 6,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            }
          ]
        },
        {
          id: "b727f024-744c-48d3-a43f-1ea2cf3c0422",
          name: "Training",
          description: "Employee training and development",
          icon: "GraduationCap",
          color: "#059669",
          is_active: true,
          services: [
            {
              id: "3b6ad265-3e8c-45c8-b4f2-cdd8ca3ce206",
              name: "Certification Reimbursement",
              description: "Request reimbursement for certification",
              estimated_delivery_days: 7,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "35a45793-5d62-4d9c-8052-8711f7920257",
              name: "Mentorship Program",
              description: "Join mentorship program",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 3,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "fd2dd2c9-1410-4746-82e9-31ab333079ea",
              name: "Onboarding Program",
              description: "New employee onboarding training",
              estimated_delivery_days: 5,
              requires_approval: false,
              status: "active",
              popularity_score: 5,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "398155c8-e376-4d57-ac5d-9cda759f9081",
              name: "Skill Assessment",
              description: "Request skill assessment",
              estimated_delivery_days: 15,
              requires_approval: false,
              status: "active",
              popularity_score: 2,
              total_requests: 0,
              is_requestable: true
            },
            {
              id: "d0354d23-5394-48ca-abe3-3d1611fd2489",
              name: "Training Request",
              description: "Request professional training course",
              estimated_delivery_days: 10,
              requires_approval: false,
              status: "active",
              popularity_score: 4,
              total_requests: 0,
              is_requestable: true
            }
          ]
        }
      ]
      
      // Transform data to match expected format
      const transformedCategories = realData.map(cat => {
        const IconComponent = categoryIconMap[cat.icon || 'settings'] || Settings
        
        return {
          id: cat.id,
          name: cat.name,
          description: cat.description || "",
          icon: IconComponent,
          color: getBgColorClass(cat.color || 'blue'),
          services: (cat.services || [])
            .map(service => ({
              id: service.id,
              name: service.name,
              description: service.description || "",
              estimated_delivery_days: service.estimated_delivery_days,
              requires_approval: service.requires_approval,
              status: service.status,
              popularity_score: service.popularity_score || 1,
              total_requests: service.total_requests || 0,
              category_name: cat.name,
              category_icon: cat.icon,
              category_color: cat.color
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        }
      }).sort((a, b) => a.name.localeCompare(b.name))
      
      setCategories(transformedCategories)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services data'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    categories,
    loading,
    error,
    refetch: fetchData
  }
}
