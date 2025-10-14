import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export class DepartmentAPI {
  // Get all unique departments from users
  async getDepartments(): Promise<string[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('department')
        .not('department', 'is', null)
        .not('department', 'eq', '')

      if (error) {
        console.error('Error fetching departments:', error)
        return []
      }

      // Extract unique departments
      const departments = profiles
        .map(p => p.department)
        .filter((dept): dept is string => dept !== null && dept !== undefined && dept.trim() !== '')
        .filter((dept, index, arr) => arr.indexOf(dept) === index)
        .sort()

      return departments
    } catch (error) {
      console.error('Error fetching departments:', error)
      return []
    }
  }

  // Add a new department by creating a system user profile with that department
  async addDepartment(departmentName: string): Promise<boolean> {
    try {
      // Check if department already exists
      const { data: existingDept } = await supabase
        .from('profiles')
        .select('department')
        .eq('department', departmentName)
        .limit(1)

      if (existingDept && existingDept.length > 0) {
        throw new Error('Department already exists')
      }

      // For now, we'll just store it in localStorage as departments are derived from user profiles
      // In a real implementation, you might want a separate departments table
      const existingDepts = localStorage.getItem('custom_departments')
      const customDepts = existingDepts ? JSON.parse(existingDepts) : []
      
      if (!customDepts.includes(departmentName)) {
        customDepts.push(departmentName)
        localStorage.setItem('custom_departments', JSON.stringify(customDepts))
      }

      return true
    } catch (error) {
      console.error('Error adding department:', error)
      throw error
    }
  }

  // Remove a department (this won't remove it from users, just from custom list)
  async removeDepartment(departmentName: string): Promise<boolean> {
    try {
      const existingDepts = localStorage.getItem('custom_departments')
      const customDepts = existingDepts ? JSON.parse(existingDepts) : []
      
      const updatedDepts = customDepts.filter((dept: string) => dept !== departmentName)
      localStorage.setItem('custom_departments', JSON.stringify(updatedDepts))

      return true
    } catch (error) {
      console.error('Error removing department:', error)
      throw error
    }
  }

  // Get custom departments from localStorage
  getCustomDepartments(): string[] {
    try {
      const existingDepts = localStorage.getItem('custom_departments')
      return existingDepts ? JSON.parse(existingDepts) : []
    } catch (error) {
      console.error('Error getting custom departments:', error)
      return []
    }
  }

  // Get all departments (from users + custom)
  async getAllDepartments(): Promise<string[]> {
    try {
      const [userDepartments, customDepartments] = await Promise.all([
        this.getDepartments(),
        Promise.resolve(this.getCustomDepartments())
      ])

      const allDepartments = [...userDepartments, ...customDepartments]
        .filter((dept, index, arr) => arr.indexOf(dept) === index) // Remove duplicates
        .sort()

      return allDepartments
    } catch (error) {
      console.error('Error getting all departments:', error)
      return []
    }
  }
}

export const departmentAPI = new DepartmentAPI()