import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const testData = await request.json()

    console.log("[v0] Testing workflow:", testData)

    const { nodes, connections } = testData
    let stepsExecuted = 0

    // Find trigger nodes
    const triggerNodes = nodes.filter((node: any) => node.type === "trigger")

    if (triggerNodes.length === 0) {
      return NextResponse.json({ success: false, error: "No trigger nodes found" }, { status: 400 })
    }

    // Simulate execution path
    for (const trigger of triggerNodes) {
      stepsExecuted++
      console.log(`[v0] Executing trigger: ${trigger.title}`)

      // Follow connections
      const connectedNodes = connections
        .filter((conn: any) => conn.from === trigger.id)
        .map((conn: any) => nodes.find((node: any) => node.id === conn.to))
        .filter(Boolean)

      for (const node of connectedNodes) {
        stepsExecuted++
        console.log(`[v0] Executing node: ${node.title}`)
      }
    }

    return NextResponse.json({
      success: true,
      stepsExecuted,
      message: "Workflow test completed successfully",
    })
  } catch (error) {
    console.error("[v0] Error testing workflow:", error)
    return NextResponse.json({ success: false, error: "Failed to test workflow" }, { status: 500 })
  }
}
