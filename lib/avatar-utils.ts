export function getInitials(name: string): string {
  if (!name) return "?"

  const words = name.trim().split(" ")
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  // Get first and last name initials
  const firstInitial = words[0].charAt(0).toUpperCase()
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`
}

export function getAvatarColor(name: string): string {
  // Generate consistent color based on name
  const colors = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-pink-500 to-rose-600",
    "bg-gradient-to-br from-indigo-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-pink-600",
    "bg-gradient-to-br from-teal-500 to-green-600",
    "bg-gradient-to-br from-yellow-500 to-orange-600",
    "bg-gradient-to-br from-red-500 to-pink-600",
    "bg-gradient-to-br from-cyan-500 to-blue-600",
  ]

  // Use name to generate consistent index
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

export function getAvatarProps(name: string) {
  return {
    initials: getInitials(name),
    colorClass: getAvatarColor(name),
  }
}
