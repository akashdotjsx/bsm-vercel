import {
  Laptop, Users, DollarSign, Scale, Building, Star, Settings, Clock, Layers,
  BarChart3, Building2, Ticket, Workflow, Monitor, BookOpen, TrendingUp, Bell,
  Zap, CheckCircle, Calendar, MoreVertical, Plus
} from 'lucide-react'

// Map string names to Lucide React components for categories
export const categoryIconMap: { [key: string]: React.ElementType } = {
  laptop: Laptop,
  users: Users,
  'dollar-sign': DollarSign,
  scale: Scale,
  building: Building,
  star: Star,
  settings: Settings,
  monitor: Monitor,
  'user-plus': Users,
  cpu: Monitor,
  calendar: Calendar,
}

// Map string names to Lucide React components for summary cards
export const summaryIconMap: { [key: string]: React.ElementType } = {
  'total-services': Building2,
  'active-services': Settings,
  'service-owners': Users,
  'categories': Layers,
}

// Function to get Tailwind CSS background color class
export function getBgColorClass(colorName: string): string {
  switch (colorName?.toLowerCase()) {
    case 'blue': return 'bg-blue-500'
    case 'green': return 'bg-green-500'
    case 'yellow': return 'bg-yellow-500'
    case 'purple': return 'bg-purple-500'
    case 'orange': return 'bg-orange-500'
    case 'red': return 'bg-red-500'
    case 'gray': return 'bg-gray-500'
    default: return 'bg-blue-500'
  }
}

// Function to get Tailwind CSS text color class
export function getTextColorClass(colorName: string): string {
  switch (colorName?.toLowerCase()) {
    case 'blue': return 'text-blue-500'
    case 'green': return 'text-green-500'
    case 'yellow': return 'text-yellow-500'
    case 'purple': return 'text-purple-500'
    case 'orange': return 'text-orange-500'
    case 'red': return 'text-red-500'
    case 'gray': return 'text-gray-500'
    default: return 'text-blue-500'
  }
}

// Function to get star rating data
export function getStarRating(rating: number) {
  return Array.from({ length: 5 }, (_, i) => ({
    filled: i < rating,
    key: i
  }))
}

// Function to format SLA display
export function formatSLA(days: number): string {
  if (days === 1) return 'Same day'
  if (days < 1) return '2 hours'
  return `${days} days`
}
