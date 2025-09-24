"use client"

import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Globe,
  Edit,
  Trash2,
  FileText,
  X,
  Upload,
  Download,
} from "lucide-react"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

import dynamic from "next/dynamic"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Calendar } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { ReusableModal } from "@/components/ui/reusable-modal"
const TicketTray = dynamic(
  () => import("@/components/tickets/ticket-tray").then((mod) => ({ default: mod.TicketTray })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
)

const countries = [
  { value: "united_states", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "united_kingdom", label: "United Kingdom" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "netherlands", label: "Netherlands" },
  { value: "belgium", label: "Belgium" },
  { value: "switzerland", label: "Switzerland" },
  { value: "austria", label: "Austria" },
  { value: "sweden", label: "Sweden" },
  { value: "norway", label: "Norway" },
  { value: "denmark", label: "Denmark" },
  { value: "finland", label: "Finland" },
  { value: "poland", label: "Poland" },
  { value: "czech_republic", label: "Czech Republic" },
  { value: "hungary", label: "Hungary" },
  { value: "portugal", label: "Portugal" },
  { value: "greece", label: "Greece" },
  { value: "ireland", label: "Ireland" },
  { value: "australia", label: "Australia" },
  { value: "new_zealand", label: "New Zealand" },
  { value: "japan", label: "Japan" },
  { value: "south_korea", label: "South Korea" },
  { value: "china", label: "China" },
  { value: "india", label: "India" },
  { value: "singapore", label: "Singapore" },
  { value: "hong_kong", label: "Hong Kong" },
  { value: "taiwan", label: "Taiwan" },
  { value: "thailand", label: "Thailand" },
  { value: "malaysia", label: "Malaysia" },
  { value: "indonesia", label: "Indonesia" },
  { value: "philippines", label: "Philippines" },
  { value: "vietnam", label: "Vietnam" },
  { value: "brazil", label: "Brazil" },
  { value: "mexico", label: "Mexico" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "peru", label: "Peru" },
  { value: "south_africa", label: "South Africa" },
  { value: "egypt", label: "Egypt" },
  { value: "israel", label: "Israel" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "saudi_arabia", label: "Saudi Arabia" },
  { value: "turkey", label: "Turkey" },
  { value: "russia", label: "Russia" },
  { value: "ukraine", label: "Ukraine" },
]

// Sample account data
const account = {
  id: 1,
  name: "Acme Corporation",
  country: "United States",
  website: "https://acme.com",
  domain: "acme.com",
  supportChannel: "Email",
  contactPerson: "John Smith",
  email: "john.smith@acme.com",
  address: "123 Business Ave, New York, NY 10001",
  status: "Active",
  createdAt: "2024-01-15T10:30:00Z",
  lastActivity: "2024-01-20T14:45:00Z",
  tags: ["Enterprise", "Priority"],
}

const sampleTickets = [
  {
    id: 1,
    ticketNumber: "KR-001",
    title: "Login Issues",
    priority: "High",
    status: "Open",
    createdAt: "2025-01-10",
    reporter: { id: "1", name: "John Smith", email: "john@example.com", avatar: null },
    assignee: { id: "2", name: "Sarah Wilson", email: "sarah@example.com", avatar: null },
  },
  {
    id: 2,
    ticketNumber: "KR-002",
    title: "Feature Request - Dashboard",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2025-01-08",
    reporter: { id: "1", name: "John Smith", email: "john@example.com", avatar: null },
    assignee: { id: "3", name: "Mike Johnson", email: "mike@example.com", avatar: null },
  },
  {
    id: 3,
    ticketNumber: "KR-003",
    title: "Bug Report - Payment Gateway",
    priority: "Critical",
    status: "Resolved",
    createdAt: "2025-01-05",
    reporter: { id: "4", name: "Lisa Brown", email: "lisa@example.com", avatar: null },
    assignee: { id: "2", name: "Sarah Wilson", email: "sarah@example.com", avatar: null },
  },
]

const sampleTasks = [
  {
    id: 1,
    title: "Setup new user accounts",
    status: "Not Started",
    assignee: "John Smith",
    assigneeId: "1",
    dueDate: "2025-01-20",
    description: "Configure user accounts for new employees",
    priority: "High",
  },
  {
    id: 2,
    title: "Configure SSO integration",
    status: "In Progress",
    assignee: "Tech Team",
    assigneeId: "2",
    dueDate: "2025-01-25",
    description: "Setup single sign-on for better security",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Update security policies",
    status: "Completed",
    assignee: "Sarah Johnson",
    assigneeId: "3",
    dueDate: "2025-01-15",
    description: "Review and update company security policies",
    priority: "Low",
  },
]

const sampleUsers = [
  { id: "1", name: "John Smith", email: "john@company.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "3", name: "Mike Chen", email: "mike@company.com" },
  { id: "4", name: "Emily Davis", email: "emily@company.com" },
  { id: "5", name: "Alex Wilson", email: "alex@company.com" },
]

const priorityOptions = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
]

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
]

const sampleActivity = [
  {
    id: 1,
    action: "Account created",
    user: "System",
    timestamp: "2024-01-15T10:30:00Z",
    type: "Account",
  },
  {
    id: 2,
    action: "Contact person updated to John Smith",
    user: "Admin User",
    timestamp: "2024-01-16T09:15:00Z",
    type: "Update",
  },
  {
    id: 3,
    action: "Support ticket #1001 created",
    user: "John Smith",
    timestamp: "2024-01-18T11:20:00Z",
    type: "Ticket",
  },
  {
    id: 4,
    action: "Account status changed to Active",
    user: "Admin User",
    timestamp: "2024-01-19T16:45:00Z",
    type: "Status",
  },
  {
    id: 5,
    action: "New contact added: Sarah Johnson",
    user: "John Smith",
    timestamp: "2024-01-20T14:30:00Z",
    type: "Contact",
  },
]

const sampleFiles = [
  {
    id: 1,
    name: "Contract_2025.pdf",
    size: "2.4 MB",
    uploadedBy: "John Smith",
    uploadedAt: "2025-01-05",
  },
  {
    id: 2,
    name: "Requirements_Doc.docx",
    size: "1.8 MB",
    uploadedBy: "Jane Doe",
    uploadedAt: "2025-01-03",
  },
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getStatusChip = (status: string) => {
  const statusConfig = {
    Active: { color: "bg-green-100 text-green-800 hover:bg-green-100", variant: "default" as const },
    Inactive: { color: "bg-gray-100 text-gray-800 hover:bg-gray-100", variant: "secondary" as const },
    Open: { color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", variant: "default" as const },
    "In Progress": { color: "bg-blue-100 text-blue-800 hover:bg-blue-100", variant: "default" as const },
    Resolved: { color: "bg-green-100 text-green-800 hover:bg-green-100", variant: "default" as const },
    Closed: { color: "bg-gray-100 text-gray-800 hover:bg-gray-100", variant: "secondary" as const },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Open

  return (
    <Badge variant={config.variant} className={`text-[13px] ${config.color}`}>
      {status}
    </Badge>
  )
}

const getPriorityChip = (priority: string) => {
  const priorityConfig = {
    Critical: { color: "bg-red-100 text-red-800 hover:bg-red-100", variant: "destructive" as const },
    High: { color: "bg-orange-100 text-orange-800 hover:bg-orange-100", variant: "default" as const },
    Medium: { color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", variant: "default" as const },
    Low: { color: "bg-green-100 text-green-800 hover:bg-green-100", variant: "default" as const },
  }

  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.Medium

  return (
    <Badge variant={config.variant} className={`text-[13px] ${config.color}`}>
      {priority}
    </Badge>
  )
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getChipColor = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ]
  const index = name.length % colors.length
  return colors[index]
}

const countryOptions = [
  { value: "united_states", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "united_kingdom", label: "United Kingdom" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "netherlands", label: "Netherlands" },
  { value: "belgium", label: "Belgium" },
  { value: "switzerland", label: "Switzerland" },
  { value: "austria", label: "Austria" },
  { value: "sweden", label: "Sweden" },
  { value: "norway", label: "Norway" },
  { value: "denmark", label: "Denmark" },
  { value: "finland", label: "Finland" },
  { value: "poland", label: "Poland" },
  { value: "czech_republic", label: "Czech Republic" },
  { value: "hungary", label: "Hungary" },
  { value: "portugal", label: "Portugal" },
  { value: "greece", label: "Greece" },
  { value: "ireland", label: "Ireland" },
  { value: "australia", label: "Australia" },
  { value: "new_zealand", label: "New Zealand" },
  { value: "japan", label: "Japan" },
  { value: "south_korea", label: "South Korea" },
  { value: "china", label: "China" },
  { value: "india", label: "India" },
  { value: "singapore", label: "Singapore" },
  { value: "hong_kong", label: "Hong Kong" },
  { value: "taiwan", label: "Taiwan" },
  { value: "thailand", label: "Thailand" },
  { value: "malaysia", label: "Malaysia" },
  { value: "indonesia", label: "Indonesia" },
  { value: "philippines", label: "Philippines" },
  { value: "vietnam", label: "Vietnam" },
  { value: "brazil", label: "Brazil" },
  { value: "mexico", label: "Mexico" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "peru", label: "Peru" },
  { value: "south_africa", label: "South Africa" },
  { value: "egypt", label: "Egypt" },
  { value: "israel", label: "Israel" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "saudi_arabia", label: "Saudi Arabia" },
  { value: "turkey", label: "Turkey" },
  { value: "russia", label: "Russia" },
  { value: "ukraine", label: "Ukraine" },
]

const initialFormData = {
  name: account.name,
  country: account.country,
  website: account.website,
  supportChannel: account.supportChannel,
  contactPerson: account.contactPerson,
  email: account.email,
  address: account.address,
}

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState(initialFormData)
  const [users, setUsers] = useState<any[]>([])
  const [countries] = useState(countryOptions)
  const [tags, setTags] = useState(["Enterprise", "High Value", "Priority"])
  const [newTag, setNewTag] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [ticketSearch, setTicketSearch] = useState("")
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All")
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("All")
  const [tickets, setTickets] = useState(sampleTickets)

  const [showContactTray, setShowContactTray] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [countryCode, setCountryCode] = useState("+1")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    title: "", // Changed from 'role' to 'title'
    department: "",
    phone: "",
  })
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@acme.com",
      title: "CEO", // Changed from 'role' to 'title'
      department: "Executive",
      phone: "+1-555-0123",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@acme.com",
      title: "CTO", // Changed from 'role' to 'title'
      department: "Technology",
      phone: "+1-555-0124",
    },
  ])

  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    website: "",
    supportChannel: "",
    contactPerson: "",
    email: "",
    address: "",
  })
  const [accountTags, setAccountTags] = useState(account.tags)
  const [searchTerm, setSearchTerm] = useState("")

  const [showTicketTray, setShowTicketTray] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  const [tasks, setTasks] = useState(sampleTasks)
  const [taskSearchTerm, setTaskSearchTerm] = useState("")
  const [taskStatusFilter, setTaskStatusFilter] = useState("all")
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all")
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigneeId: "",
    dueDate: "",
    priority: "Medium",
    status: "Not Started",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("is_active", true)
          .order("first_name")

        if (error) {
          console.error("Error fetching users:", error)
          return
        }

        const userOptions =
          data?.map((user) => ({
            value: user.id,
            label: `${user.first_name} ${user.last_name} (${user.email})`,
          })) || []

        setUsers(userOptions)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  const countryCodes = [
    { code: "+1", country: "US/CA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
  ]

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.reporter.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.assignee.name.toLowerCase().includes(ticketSearch.toLowerCase())

    const matchesStatus = ticketStatusFilter === "All" || ticket.status === ticketStatusFilter
    const matchesPriority = ticketPriorityFilter === "All" || ticket.priority === ticketPriorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleTicketPriorityChange = (ticketId: number, newPriority: string) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket)))
  }

  const handleTicketStatusChange = (ticketId: number, newStatus: string) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket)))
  }

  const handleTicketReporterChange = (ticketId: number, newReporterId: string) => {
    const newReporter = sampleUsers.find((user) => user.id === newReporterId)
    if (newReporter) {
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, reporter: newReporter } : ticket)),
      )
    }
  }

  const handleTicketAssigneeChange = (ticketId: number, newAssigneeId: string) => {
    const newAssignee = sampleUsers.find((user) => user.id === newAssigneeId)
    if (newAssignee) {
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, assignee: newAssignee } : ticket)),
      )
    }
  }

  const openTicketTray = (ticketId: number) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) {
      setSelectedTicket(ticket)
      setShowTicketTray(true)
    }
  }

  const openNewTicketTray = () => {
    setSelectedTicket(null)
    setShowTicketTray(true)
  }

  const handleTicketTrayClose = () => {
    setShowTicketTray(false)
    setSelectedTicket(null)
  }

  const UserAvatar = ({ user, onClick }: { user: any; onClick?: () => void }) => {
    const initials = user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
    return (
      <div
        className={`w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium ${onClick ? "cursor-pointer hover:bg-blue-600" : ""}`}
        onClick={onClick}
        title={`${user.name} (${user.email})`}
      >
        {initials}
      </div>
    )
  }

  const [showContactModal, setShowContactModal] = useState(false)
  const handleAddContact = () => {
    setEditingContact(null)
    setContactForm({
      name: "",
      email: "",
      title: "",
      department: "",
      phone: "",
    })
    setCountryCode("+1")
    setShowContactModal(true)
  }

  const handleEditContact = (contact: any) => {
    setEditingContact(contact)
    setContactForm({
      name: contact.name,
      email: contact.email,
      title: contact.title, // Changed from 'role' to 'title'
      department: contact.department,
      phone: contact.phone.replace(/^\+\d+-/, ""), // Remove country code from phone
    })
    // Extract country code from phone
    const phoneMatch = contact.phone.match(/^(\+\d+)-/)
    if (phoneMatch) {
      setCountryCode(phoneMatch[1])
    }
    setShowContactModal(true)
  }

  const handleSaveContact = () => {
    if (!contactForm.name || !contactForm.email) {
      alert("Please fill in required fields")
      return
    }

    const fullPhone = `${countryCode}-${contactForm.phone}`

    if (editingContact) {
      // Update existing contact
      setContacts(
        contacts.map((contact) =>
          contact.id === editingContact.id
            ? { ...contact, ...contactForm, phone: fullPhone, title: contactForm.title }
            : contact,
        ),
      )
    } else {
      // Add new contact
      const newContact = {
        id: Date.now(),
        ...contactForm,
        phone: fullPhone,
        title: contactForm.title, // Ensure title is included
      }
      setContacts([...contacts, newContact])
    }

    setShowContactModal(false)
    setEditingContact(null)
  }

  const handleCancelContact = () => {
    setShowContactTray(false)
    setContactForm({ name: "", email: "", title: "", department: "", phone: "" })
    setEditingContact(null)
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.title.toLowerCase().includes(searchTerm.toLowerCase()) || // Changed from 'role' to 'title'
      contact.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditAccount = () => {
    setFormData({
      name: account.name,
      country: account.country,
      website: account.website,
      supportChannel: account.supportChannel,
      contactPerson: account.contactPerson,
      email: account.email,
      address: account.address,
    })
    setShowEditModal(true)
  }

  const handleUpdateAccount = () => {
    console.log("Updating account:", formData)
    toast({
      title: "Account Updated",
      description: `${formData.name} has been successfully updated.`,
    })
    setShowEditModal(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !accountTags.includes(newTag.trim())) {
      setAccountTags([...accountTags, newTag.trim()])
      setNewTag("")
      setShowAddTag(false)
      toast({
        title: "Tag Added",
        description: `Tag "${newTag.trim()}" has been added to the account.`,
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setAccountTags(accountTags.filter((tag) => tag !== tagToRemove))
    toast({
      title: "Tag Removed",
      description: `Tag "${tagToRemove}" has been removed from the account.`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "Medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(taskSearchTerm.toLowerCase())
    const matchesStatus = taskStatusFilter === "all" || task.status === taskStatusFilter
    const matchesPriority = taskPriorityFilter === "all" || task.priority === taskPriorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination } = result
    if (source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId
    const taskId = Number.parseInt(result.draggableId)

    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const handleAssigneeChange = (taskId: number, assigneeId: string) => {
    const assignee = sampleUsers.find((user) => user.id === assigneeId)
    if (assignee) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, assigneeId, assignee: assignee.name } : task)),
      )
    }
  }

  const handleCreateTask = () => {
    const assignee = sampleUsers.find((user) => user.id === newTask.assigneeId)
    const task = {
      id: tasks.length + 1,
      ...newTask,
      assignee: assignee?.name || "Unassigned",
    }
    setTasks((prevTasks) => [...prevTasks, task])
    setNewTask({
      title: "",
      description: "",
      assigneeId: "",
      dueDate: "",
      priority: "Medium",
      status: "Not Started",
    })
    setShowNewTaskModal(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!account) {
    return (
      <PlatformLayout title="Account Not Found" description="The requested account could not be found">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Account Not Found</h2>
          <Button onClick={() => router.push("/bsm/accounts")} className="text-[13px]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </div>
      </PlatformLayout>
    )
  }

  const handleDeleteContact = (contactId: number) => {
    setContacts(contacts.filter((contact) => contact.id !== contactId))
  }

  return (
    <PlatformLayout
      title={account.name}
      description="Account details and management"
      breadcrumbs={[
        { label: "Service Management", href: "/bsm/dashboard" },
        { label: "All Accounts", href: "/bsm/accounts" },
        { label: account.name, href: `/bsm/accounts/${account.id}` },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div className="text-[13px] text-muted-foreground">/</div>
            <h1 className="text-xl font-semibold">{account.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent" onClick={handleEditAccount}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="text-[13px]">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tickets" className="text-[13px]">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-[13px]">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-[13px]">
              Contacts
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-[13px]">
              Activity
            </TabsTrigger>
            <TabsTrigger value="files" className="text-[13px]">
              Files
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-[13px]">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Account Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[13px]">Account Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Name</label>
                        <p className="text-[13px] text-muted-foreground">{account.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Owner</label>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 ${getChipColor(account.contactPerson)} rounded-full flex items-center justify-center text-white text-xs font-medium`}
                          >
                            {getInitials(account.contactPerson)}
                          </div>
                          <span className="text-[13px] text-muted-foreground">{account.contactPerson}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Domain</label>
                        <p className="text-[13px] text-muted-foreground">{account.domain}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tags</label>
                        <div className="flex flex-wrap gap-1">
                          {accountTags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-[13px] group relative">
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          {showAddTag ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Tag name"
                                className="h-6 w-20 text-[13px]"
                                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                                autoFocus
                              />
                              <Button variant="ghost" size="sm" className="h-6 px-1" onClick={handleAddTag}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                                onClick={() => setShowAddTag(false)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[13px]"
                              onClick={() => setShowAddTag(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add tag
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Created On</label>
                        <p className="text-[13px] text-muted-foreground">{formatDateTime(account.createdAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        {getStatusChip(account.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[13px]">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sampleActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-[13px] font-medium">{activity.action}</p>
                            <p className="text-[13px] text-muted-foreground">
                              by {activity.user} • {formatDateTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[13px]">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Open Tickets</span>
                      <span className="text-[13px] font-medium">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Active Tasks</span>
                      <span className="text-[13px] font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Total Contacts</span>
                      <span className="text-[13px] font-medium">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Files Uploaded</span>
                      <span className="text-[13px] font-medium">2</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[13px]">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[13px]">{account.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[13px]">{account.website}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[13px]">{account.address}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Tickets</h3>
              <Button size="sm" className="text-[13px]" onClick={openNewTicketTray}>
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="pl-10 text-[13px]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                  <SelectTrigger className="w-32 text-[13px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All" className="text-[13px]">
                      All Status
                    </SelectItem>
                    <SelectItem value="Open" className="text-[13px]">
                      Open
                    </SelectItem>
                    <SelectItem value="In Progress" className="text-[13px]">
                      In Progress
                    </SelectItem>
                    <SelectItem value="Resolved" className="text-[13px]">
                      Resolved
                    </SelectItem>
                    <SelectItem value="Closed" className="text-[13px]">
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ticketPriorityFilter} onValueChange={setTicketPriorityFilter}>
                  <SelectTrigger className="w-32 text-[13px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All" className="text-[13px]">
                      All Priority
                    </SelectItem>
                    <SelectItem value="Critical" className="text-[13px]">
                      Critical
                    </SelectItem>
                    <SelectItem value="High" className="text-[13px]">
                      High
                    </SelectItem>
                    <SelectItem value="Medium" className="text-[13px]">
                      Medium
                    </SelectItem>
                    <SelectItem value="Low" className="text-[13px]">
                      Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-3 px-4 font-medium text-xs">Ticket ID</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Title</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Priority</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Reporter</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-[13px] font-medium">{ticket.ticketNumber}</td>
                          <td className="py-3 px-4">
                            <button
                              className="text-[13px] font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                              onClick={() => openTicketTray(ticket.id)}
                            >
                              {ticket.title}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="cursor-pointer">{getPriorityChip(ticket.priority)}</div>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-0" align="start">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {priorityOptions.map((option) => (
                                        <CommandItem
                                          key={option.value}
                                          value={option.value}
                                          onSelect={() => handleTicketPriorityChange(ticket.id, option.value)}
                                          className="text-[13px] cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              ticket.priority === option.value ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {option.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="py-3 px-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="cursor-pointer">{getStatusChip(ticket.status)}</div>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-0" align="start">
                                <Command>
                                  <CommandList>
                                    <CommandGroup>
                                      {statusOptions.map((option) => (
                                        <CommandItem
                                          key={option.value}
                                          value={option.value}
                                          onSelect={() => handleTicketStatusChange(ticket.id, option.value)}
                                          className="text-[13px] cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              ticket.status === option.value ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {option.label}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="py-3 px-4 text-[13px]">{formatDate(ticket.createdAt)}</td>
                          <td className="py-3 px-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="cursor-pointer">
                                  <UserAvatar user={ticket.reporter} />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search users..." className="text-[13px]" />
                                  <CommandList>
                                    <CommandEmpty className="text-[13px]">No user found.</CommandEmpty>
                                    <CommandGroup>
                                      {sampleUsers.map((user) => (
                                        <CommandItem
                                          key={user.id}
                                          value={user.id}
                                          onSelect={() => handleTicketReporterChange(ticket.id, user.id)}
                                          className="text-[13px] cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <UserAvatar user={user} />
                                            <div>
                                              <div className="font-medium">{user.name}</div>
                                              <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="py-3 px-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="cursor-pointer">
                                  <UserAvatar user={ticket.assignee} />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search users..." className="text-[13px]" />
                                  <CommandList>
                                    <CommandEmpty className="text-[13px]">No user found.</CommandEmpty>
                                    <CommandGroup>
                                      {sampleUsers.map((user) => (
                                        <CommandItem
                                          key={user.id}
                                          value={user.id}
                                          onSelect={() => handleTicketAssigneeChange(ticket.id, user.id)}
                                          className="text-[13px] cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <UserAvatar user={user} />
                                            <div>
                                              <div className="font-medium">{user.name}</div>
                                              <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-[13px]">
                    No tickets found matching your search criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Tasks</h3>
              <Button size="sm" className="text-[13px]" onClick={() => setShowNewTaskModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  className="pl-10 text-[13px]"
                />
              </div>

              <div className="flex gap-2">
                <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                  <SelectTrigger className="w-[140px] text-[13px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                  <SelectTrigger className="w-[140px] text-[13px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Not Started", "In Progress", "Completed"].map((status) => (
                  <Card key={status}>
                    <CardHeader>
                      <CardTitle className="text-[13px] flex items-center justify-between">
                        {status} ({getTasksByStatus(status).length})
                        <Badge className={getStatusColor(status)}>{getTasksByStatus(status).length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                              snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
                            }`}
                          >
                            {getTasksByStatus(status).map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-move ${
                                      snapshot.isDragging ? "rotate-2 shadow-lg" : ""
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-500">
                                              KR-{String(task.id).padStart(3, "0")}
                                            </span>
                                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                                          </div>
                                          <h4 className="text-[13px] font-medium line-clamp-2">{task.title}</h4>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{formatDate(task.dueDate)}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <Combobox
                                          options={sampleUsers.map((user) => ({
                                            value: user.id,
                                            label: user.name,
                                          }))}
                                          value={task.assigneeId}
                                          onValueChange={(value) => handleAssigneeChange(task.id, value)}
                                          placeholder="Assign to..."
                                          className="flex-1"
                                          trigger={
                                            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                              <div
                                                className={`w-6 h-6 ${getChipColor(task.assignee)} rounded-full flex items-center justify-center text-white text-xs`}
                                              >
                                                {getInitials(task.assignee)}
                                              </div>
                                              <span className="text-[13px] truncate max-w-[80px]">{task.assignee}</span>
                                            </div>
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DragDropContext>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Contacts</CardTitle>
                      <CardDescription className="text-[13px] text-gray-600">
                        Manage account contacts and their information
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddContact} className="text-[13px]">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-[13px]"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Title</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Phone</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map((contact) => (
                          <tr key={contact.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 border-r">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-6 h-6 ${getChipColor(contact.name)} rounded-full flex items-center justify-center text-white text-xs font-medium`}
                                  title={contact.name}
                                >
                                  {getInitials(contact.name)}
                                </div>
                                <span className="text-[13px] font-medium">{contact.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[13px] border-r">{contact.email}</td>
                            <td className="py-3 px-4 text-[13px] border-r">{contact.title}</td>
                            <td className="py-3 px-4 text-[13px] border-r">{contact.department}</td>
                            <td className="py-3 px-4 text-[13px] border-r">{contact.phone}</td>
                            <td className="py-3 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="text-[13px]" onClick={() => handleEditContact(contact)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Contact
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-[13px] text-red-600"
                                    onClick={() => handleDeleteContact(contact.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Contact
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                        {filteredContacts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500 text-[13px]">
                              {searchTerm ? "No contacts found matching your search." : "No contacts added yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Activity Timeline</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {sampleActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < sampleActivity.length - 1 && <div className="w-px h-12 bg-gray-200 mt-2"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[13px] font-medium">{activity.action}</span>
                          <Badge variant="outline" className="text-[13px]">
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-1">
                          by {activity.user} • {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Files</h3>
              <Button size="sm" className="text-[13px]">
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-[13px] text-muted-foreground mb-2">Upload a file or drag and drop it here</p>
                  <p className="text-[13px] text-muted-foreground">Max file size: 25 MB</p>
                  <Button variant="outline" size="sm" className="mt-4 text-[13px] bg-transparent">
                    Choose File
                  </Button>
                </div>
                <div className="space-y-3">
                  {sampleFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-[13px] font-medium">{file.name}</p>
                          <p className="text-[13px] text-muted-foreground">
                            {file.size} • Uploaded by {file.uploadedBy} on {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-medium">Account Settings</h3>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[13px]">General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Status</label>
                    <div className="flex items-center space-x-4">
                      {getStatusChip(account.status)}
                      <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
                        Change Status
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notifications</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-[13px]">Email notifications for new tickets</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-[13px]">SMS notifications for urgent issues</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[13px] text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Disable Account</h4>
                    <p className="text-[13px] text-muted-foreground mb-3">
                      Disable account and remove from external channels to stop syncing conversations.
                    </p>
                    <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
                      Disable Account
                    </Button>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Delete Account</h4>
                    <p className="text-[13px] text-muted-foreground mb-3">
                      Permanently delete this account and all associated data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm" className="text-[13px]">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>Update the account information below.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter account name"
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <Combobox
                  options={countries}
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                  placeholder="Select country..."
                  searchPlaceholder="Search countries..."
                  emptyText="No country found."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Channel</label>
                <select
                  value={formData.supportChannel}
                  onChange={(e) => setFormData({ ...formData, supportChannel: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-[13px]"
                >
                  <option value="Email">Email</option>
                  <option value="Slack">Slack</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Owner</label>
                <Combobox
                  options={users}
                  value={formData.contactPerson}
                  onValueChange={(value) => setFormData({ ...formData, contactPerson: value })}
                  placeholder="Select account owner..."
                  searchPlaceholder="Search users..."
                  emptyText="No user found."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  type="email"
                  className="text-[13px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  className="text-[13px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={handleUpdateAccount} className="text-[13px]">
                Update Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Management Tray */}
        {showContactTray && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
            <div className="bg-white h-full w-96 shadow-xl overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h3>
                  <Button variant="ghost" size="sm" onClick={handleCancelContact}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[13px] font-medium">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="mt-1 text-[13px]"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-[13px] font-medium">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="mt-1 text-[13px]"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-[13px] font-medium">
                    Role
                  </Label>
                  <Select
                    value={contactForm.role}
                    onValueChange={(value) => setContactForm({ ...contactForm, role: value })}
                  >
                    <SelectTrigger className="mt-1 text-[13px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT Manager" className="text-[13px]">
                        IT Manager
                      </SelectItem>
                      <SelectItem value="Admin" className="text-[13px]">
                        Admin
                      </SelectItem>
                      <SelectItem value="Developer" className="text-[13px]">
                        Developer
                      </SelectItem>
                      <SelectItem value="Support" className="text-[13px]">
                        Support
                      </SelectItem>
                      <SelectItem value="Manager" className="text-[13px]">
                        Manager
                      </SelectItem>
                      <SelectItem value="Director" className="text-[13px]">
                        Director
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department" className="text-[13px] font-medium">
                    Department
                  </Label>
                  <Select
                    value={contactForm.department}
                    onValueChange={(value) => setContactForm({ ...contactForm, department: value })}
                  >
                    <SelectTrigger className="mt-1 text-[13px]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Information Technology" className="text-[13px]">
                        Information Technology
                      </SelectItem>
                      <SelectItem value="Administration" className="text-[13px]">
                        Administration
                      </SelectItem>
                      <SelectItem value="Human Resources" className="text-[13px]">
                        Human Resources
                      </SelectItem>
                      <SelectItem value="Finance" className="text-[13px]">
                        Finance
                      </SelectItem>
                      <SelectItem value="Operations" className="text-[13px]">
                        Operations
                      </SelectItem>
                      <SelectItem value="Sales" className="text-[13px]">
                        Sales
                      </SelectItem>
                      <SelectItem value="Marketing" className="text-[13px]">
                        Marketing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-[13px] font-medium">
                    Phone
                  </Label>
                  <div className="flex mt-1">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-32 text-[13px] rounded-r-none border-r-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code} className="text-[13px]">
                            <span className="flex items-center space-x-2">
                              <span>{country.flag}</span>
                              <span>{country.code}</span>
                              <span className="text-gray-500">({country.country})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="text-[13px] rounded-l-none flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancelContact} className="text-[13px] bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContact}
                  className="text-[13px]"
                  disabled={!contactForm.name || !contactForm.email}
                >
                  {editingContact ? "Update Contact" : "Add Contact"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Title</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className="text-[13px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description..."
                  className="w-full p-2 border rounded-md text-[13px] min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <Select
                  value={newTask.assigneeId}
                  onChange={(value) => setNewTask((prev) => ({ ...prev, assigneeId: value }))}
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select assignee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 ${getChipColor(user.name)} rounded-full flex items-center justify-center text-white text-xs`}
                          >
                            {getInitials(user.name)}
                          </div>
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select
                    value={newTask.priority}
                    onChange={(value) => setNewTask((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="text-[13px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowNewTaskModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!newTask.title.trim()} className="text-[13px]">
                Create Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTicketTray && (
        <TicketTray
          isOpen={showTicketTray}
          onClose={handleTicketTrayClose}
          ticket={selectedTicket}
          onTicketUpdate={(updatedTicket) => {
            if (selectedTicket) {
              // Update existing ticket
              setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)))
            } else {
              // Add new ticket
              setTickets((prev) => [...prev, updatedTicket])
            }
          }}
        />
      )}
      <ReusableModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={editingContact ? "Edit Contact" : "Add New Contact"}
        description="Enter contact information below"
        onConfirm={handleSaveContact}
        onCancel={() => setShowContactModal(false)}
        confirmText={editingContact ? "Update Contact" : "Add Contact"}
        cancelText="Cancel"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-[13px] font-medium">
              Name *
            </Label>
            <Input
              id="name"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              placeholder="Enter full name"
              className="mt-1 text-[13px]"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-[13px] font-medium">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              placeholder="Enter email address"
              className="mt-1 text-[13px]"
              required
            />
          </div>

          <div>
            <Label htmlFor="title" className="text-[13px] font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={contactForm.title}
              onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
              placeholder="Enter job title"
              className="mt-1 text-[13px]"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-[13px] font-medium">
              Phone
            </Label>
            <div className="flex gap-2 mt-1">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-24 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+1" className="text-[13px]">
                    🇺🇸 +1
                  </SelectItem>
                  <SelectItem value="+44" className="text-[13px]">
                    🇬🇧 +44
                  </SelectItem>
                  <SelectItem value="+33" className="text-[13px]">
                    🇫🇷 +33
                  </SelectItem>
                  <SelectItem value="+49" className="text-[13px]">
                    🇩🇪 +49
                  </SelectItem>
                  <SelectItem value="+81" className="text-[13px]">
                    🇯🇵 +81
                  </SelectItem>
                  <SelectItem value="+86" className="text-[13px]">
                    🇨🇳 +86
                  </SelectItem>
                  <SelectItem value="+91" className="text-[13px]">
                    🇮🇳 +91
                  </SelectItem>
                  <SelectItem value="+61" className="text-[13px]">
                    🇦🇺 +61
                  </SelectItem>
                  <SelectItem value="+55" className="text-[13px]">
                    🇧🇷 +55
                  </SelectItem>
                  <SelectItem value="+7" className="text-[13px]">
                    🇷🇺 +7
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="Enter phone number"
                className="flex-1 text-[13px]"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="department" className="text-[13px] font-medium">
              Department
            </Label>
            <Select
              value={contactForm.department}
              onChange={(value) => setContactForm({ ...contactForm, department: value })}
            >
              <SelectTrigger className="mt-1 text-[13px]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Information Technology" className="text-[13px]">
                  Information Technology
                </SelectItem>
                <SelectItem value="Administration" className="text-[13px]">
                  Administration
                </SelectItem>
                <SelectItem value="Human Resources" className="text-[13px]">
                  Human Resources
                </SelectItem>
                <SelectItem value="Finance" className="text-[13px]">
                  Finance
                </SelectItem>
                <SelectItem value="Marketing" className="text-[13px]">
                  Marketing
                </SelectItem>
                <SelectItem value="Sales" className="text-[13px]">
                  Sales
                </SelectItem>
                <SelectItem value="Operations" className="text-[13px]">
                  Operations
                </SelectItem>
                <SelectItem value="Executive" className="text-[13px]">
                  Executive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ReusableModal>
    </PlatformLayout>
  )
}
