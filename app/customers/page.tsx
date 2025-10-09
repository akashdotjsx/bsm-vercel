"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Filter, MoreHorizontal, Users, X, Plus } from "lucide-react"

const customerAccounts = [
  {
    id: 1,
    name: "Brex",
    logo: "/brex-logo.png",
    owner: {
      name: "Marty Kausas",
      avatar: "/marty-avatar.png",
    },
    type: "Customer",
    primaryDomain: "brex.com",
    slackChannel: "#ext-stripe-brex",
    lastCustomerActivity: "Mar 14, 2025, 9:14 AM",
    lastBroadcastSent: "Mar 6, 2025, 1:28 PM",
  },
  {
    id: 2,
    name: "Datadog",
    logo: "/datadog-logo.png",
    owner: {
      name: "Robert Eng",
      avatar: "/robert-avatar.png",
    },
    type: "Customer",
    primaryDomain: "datadog.com",
    slackChannel: "#ext-stripe-datadog",
    lastCustomerActivity: "Feb 8, 2025, 9:10 PM",
    lastBroadcastSent: "Mar 6, 2025, 1:28 PM",
  },
  {
    id: 3,
    name: "Spotify",
    logo: "/spotify-logo.png",
    owner: {
      name: "Marty Kausas",
      avatar: "/marty-avatar.png",
    },
    type: "Customer",
    primaryDomain: "spotify.com",
    slackChannel: "#ext-stripe-spotify",
    lastCustomerActivity: "Mar 24, 2025, 5:43 PM",
    lastBroadcastSent: "Mar 6, 2025, 1:28 PM",
  },
  {
    id: 4,
    name: "Scale",
    logo: "/scale-logo.png",
    owner: {
      name: "Marty Kausas",
      avatar: "/marty-avatar.png",
    },
    type: "Customer",
    primaryDomain: "scale.com",
    slackChannel: "#ext-stripe-scale",
    lastCustomerActivity: "Mar 24, 2025, 3:38 PM",
    lastBroadcastSent: "Mar 6, 2025, 1:28 PM",
  },
  {
    id: 5,
    name: "Figma",
    logo: "/figma-logo.png",
    owner: {
      name: "Robert Eng",
      avatar: "/robert-avatar.png",
    },
    type: "Customer",
    primaryDomain: "figma.com",
    slackChannel: "#ext-stripe-figma",
    lastCustomerActivity: "Mar 11, 2025, 8:17 AM",
    lastBroadcastSent: "Mar 6, 2025, 1:28 PM",
  },
  {
    id: 6,
    name: "Nike",
    logo: "/nike-swoosh.png",
    owner: {
      name: "Marty Kausas",
      avatar: "/marty-avatar.png",
    },
    type: "Customer",
    primaryDomain: "nike.com",
    slackChannel: "#ext-stripe-nike",
    lastCustomerActivity: "Mar 24, 2025, 2:50 PM",
    lastBroadcastSent: "Mar 6, 2025, 1:28 PM",
  },
]

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])

  const filteredAccounts = customerAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleAccountSelection = (accountId: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    )
  }

  const toggleAllAccounts = () => {
    setSelectedAccounts(
      selectedAccounts.length === filteredAccounts.length ? [] : filteredAccounts.map((account) => account.id),
    )
  }

  return (
    <PlatformLayout
      breadcrumb={[
        { label: "Customer Support", href: "/dashboard" },
        { label: "Customers", href: "/customers" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-[13px] font-semibold text-foreground">Customers</h1>
          </div>
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              Type is Customer
              <X className="ml-1 h-3 w-3 cursor-pointer" />
            </Badge>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedAccounts.length === filteredAccounts.length}
                    onCheckedChange={toggleAllAccounts}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Primary Domain</TableHead>
                <TableHead>Slack Channel</TableHead>
                <TableHead>Last Customer Activity</TableHead>
                <TableHead>Last Broadcast Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccountSelection(account.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={account.logo || "/placeholder.svg"} alt={account.name} />
                        <AvatarFallback className="text-xs">{account.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{account.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={account.owner.avatar || "/placeholder.svg"} alt={account.owner.name} />
                        <AvatarFallback className="text-xs">
                          {account.owner.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{account.owner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      {account.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{account.primaryDomain}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{account.slackChannel}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{account.lastCustomerActivity}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{account.lastBroadcastSent}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">{filteredAccounts.length} accounts</div>
      </div>
    </PlatformLayout>
  )
}
