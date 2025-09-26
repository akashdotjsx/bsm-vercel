'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Check, ChevronDown } from 'lucide-react'
import { rbacApi } from '@/lib/api/rbac'
import type { 
  Role, 
  Permission, 
  RoleEditFormData, 
  PermissionAction,
  ResourceModule 
} from '@/lib/types/rbac'
import { MODULE_DISPLAY_NAMES, PERMISSION_LEVELS } from '@/lib/types/rbac'

interface RoleEditModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role | null
  onSave: (role: Role) => void
}

export function RoleEditModal({ isOpen, onClose, role, onSave }: RoleEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [formData, setFormData] = useState<RoleEditFormData>({
    name: '',
    description: '',
    permissions: {}
  })

  // Load permissions and initialize form
  useEffect(() => {
    const loadData = async () => {
      try {
        const allPermissions = await rbacApi.getPermissions()
        setPermissions(allPermissions)

        if (role) {
          const roleData = rbacApi.convertRoleToFormData(role)
          setFormData(roleData)
        } else {
          setFormData({
            name: '',
            description: '',
            permissions: {}
          })
        }
      } catch (error) {
        console.error('Error loading role data:', error)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen, role])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Role name is required')
      return
    }

    setLoading(true)
    try {
      const permissionIds = await rbacApi.convertFormDataToPermissions(formData, permissions)
      
      let savedRole: Role
      if (role) {
        // Update existing role
        savedRole = await rbacApi.updateRole(role.id, {
          name: formData.name,
          description: formData.description,
          permissionIds
        })
      } else {
        // Create new role
        savedRole = await rbacApi.createRole({
          name: formData.name,
          description: formData.description,
          permissionIds
        })
      }

      onSave(savedRole)
      onClose()
    } catch (error) {
      console.error('Error saving role:', error)
      alert('Error saving role: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (module: ResourceModule, level: PermissionAction | null) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: level
      }
    }))
  }

  const getPermissionLevel = (module: ResourceModule): PermissionAction | null => {
    return formData.permissions[module] || null
  }

  const renderPermissionSelect = (module: ResourceModule) => {
    const currentLevel = getPermissionLevel(module)
    
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-gray-300 rounded" />
          <span className="text-sm font-medium">{MODULE_DISPLAY_NAMES[module]}</span>
        </div>
        
        <Select
          value={currentLevel || 'none'}
          onValueChange={(value) => 
            handlePermissionChange(module, value === 'none' ? null : value as PermissionAction)
          }
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {PERMISSION_LEVELS.map(level => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const mainModules: ResourceModule[] = [
    'tickets', 'services', 'users', 'analytics', 'security'
  ]
  
  const otherModules: ResourceModule[] = [
    'knowledge_base', 'assets', 'reports', 'integrations', 'administration'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-lg font-semibold">
              {role ? 'Edit User Role' : 'Create New Role'}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {role 
                ? `Update the permissions for ${role.name}`
                : 'Create a new role with custom permissions'
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name" className="text-sm font-medium">
                Role Name
              </Label>
              <Input
                id="role-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                placeholder="e.g., System Administrator"
                disabled={role?.is_system_role}
              />
            </div>

            <div>
              <Label htmlFor="role-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="role-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 resize-none"
                rows={2}
                placeholder="Complete system access and management"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Permissions</Label>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-1">
                {mainModules.map(module => renderPermissionSelect(module))}
              </div>

              {/* Right Column */}
              <div className="space-y-1">
                {otherModules.map(module => renderPermissionSelect(module))}
              </div>
            </div>
          </div>

          {/* Permission Level Legend */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              Permission Levels
              <ChevronDown className="h-4 w-4" />
            </h4>
            
            <div className="space-y-2 text-sm">
              {PERMISSION_LEVELS.map(level => (
                <div key={level.value} className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-medium">{level.label}</span>
                  </div>
                  <span className="text-gray-600">{level.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-black text-white hover:bg-gray-800">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}