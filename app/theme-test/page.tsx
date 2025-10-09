"use client"

import { useState } from "react"
import { themeConfig } from "@/lib/theme"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ThemeTestPage() {
  const [fontSize, setFontSize] = useState("13px")

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Theme Testing Suite</h1>
          <p className="text-muted-foreground">
            Visualize and test all theme tokens. Changes here affect the entire application.
          </p>
        </div>

        {/* Quick Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎨 Quick Theme Controls</CardTitle>
            <CardDescription>
              Edit these values in <code className="text-xs">app/globals.css</code> to change theme globally
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Base Font Size</label>
                <Input
                  type="text"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  placeholder="13px"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CSS Variable: <code>--text-base</code>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full h-10 bg-primary rounded border" />
                  <code className="text-xs">#6E72FF</code>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CSS Variable: <code>--primary</code>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Border Radius</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full h-10 bg-muted rounded-lg border" />
                  <code className="text-xs">10px</code>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CSS Variable: <code>--radius</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="typography" className="space-y-4">
          <TabsList>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Font Sizes</CardTitle>
                <CardDescription>All standardized font sizes from theme config</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(themeConfig.typography.fontSize).map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-4 border-b pb-2">
                    <code className="text-xs w-20 text-muted-foreground">{key}</code>
                    <code className="text-xs w-16 font-mono">{value}</code>
                    <span className={`text-${key}`}>
                      The quick brown fox jumps over the lazy dog
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Weights</CardTitle>
                <CardDescription>Consistent weight scale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(themeConfig.typography.fontWeight).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <code className="text-xs w-24 text-muted-foreground">{key}</code>
                    <code className="text-xs w-12 font-mono">{value}</code>
                    <span style={{ fontWeight: value }}>
                      The quick brown fox jumps over the lazy dog
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Line Heights</CardTitle>
                <CardDescription>Vertical spacing between lines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(themeConfig.typography.lineHeight).map(([key, value]) => (
                  <div key={key} className="border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs text-muted-foreground">{key}</code>
                      <code className="text-xs font-mono">{value}</code>
                    </div>
                    <p style={{ lineHeight: value }} className="text-sm">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Semantic Colors</CardTitle>
                <CardDescription>CSS variables that adapt to light/dark mode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Background", class: "bg-background", text: "text-foreground" },
                    { name: "Foreground", class: "bg-foreground", text: "text-background" },
                    { name: "Card", class: "0 border", text: "text-card-foreground" },
                    { name: "Primary", class: "bg-primary", text: "text-primary-foreground" },
                    { name: "Secondary", class: "bg-secondary", text: "text-secondary-foreground" },
                    { name: "Muted", class: "bg-muted", text: "text-muted-foreground" },
                    { name: "Accent", class: "bg-accent", text: "text-accent-foreground" },
                    { name: "Destructive", class: "bg-destructive", text: "text-destructive-foreground" },
                  ].map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div className={`${color.class} ${color.text} p-4 rounded-lg`}>
                        <p className="font-medium">{color.name}</p>
                        <p className="text-sm opacity-75">Sample text</p>
                      </div>
                      <code className="text-xs text-muted-foreground">{color.class}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Spacing Scale</CardTitle>
                <CardDescription>Consistent spacing for margins, padding, gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(themeConfig.spacing).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4">
                      <code className="text-xs w-12 text-muted-foreground">{key}</code>
                      <code className="text-xs w-20 font-mono">{value}</code>
                      <div className="bg-primary" style={{ width: value, height: '24px' }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
                <CardDescription>Corner rounding options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(themeConfig.borderRadius).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div
                        className="bg-primary h-20 border-2 border-primary-foreground"
                        style={{ borderRadius: value }}
                      />
                      <div className="text-center">
                        <code className="text-xs text-muted-foreground">{key}</code>
                        <p className="text-xs font-mono">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Standard button variations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Status indicators and labels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
                <CardDescription>Form input components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Default input" />
                <Input placeholder="Disabled input" disabled />
                <Input type="email" placeholder="Email input" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cards</CardTitle>
                <CardDescription>Container components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Card Title</CardTitle>
                      <CardDescription>Card description text</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Card content goes here.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Another Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">More content here.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Third Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Even more content.</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">📝 How to Use This Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. <strong>Test changes</strong>: Modify CSS variables in <code>app/globals.css</code></p>
            <p>2. <strong>See results</strong>: Refresh this page to see theme changes instantly</p>
            <p>3. <strong>Dark mode</strong>: Toggle dark mode to test both themes</p>
            <p>4. <strong>Migration</strong>: Run <code>./scripts/migrate-font-sizes.sh --dry-run</code> to preview migrations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
