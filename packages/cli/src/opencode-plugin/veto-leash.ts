/**
 * veto-leash OpenCode Plugin
 * 
 * Native integration for OpenCode that intercepts tool calls and enforces policies.
 * This plugin hooks into tool.execute.before to block restricted operations
 * with seamless, non-distractive feedback via toasts.
 * 
 * Installation:
 *   1. Copy to ~/.config/opencode/plugin/veto-leash.ts (global)
 *   2. Or copy to .opencode/plugin/veto-leash.ts (project-level)
 *   3. Restart OpenCode
 * 
 * Or add to opencode.json:
 *   { "plugin": ["veto-leash"] }
 */

import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"

// Policy types
interface CommandRule {
  block: string[]
  reason: string
  suggest?: string
}

interface ContentRule {
  pattern: string
  fileTypes: string[]
  reason: string
  suggest?: string
}

interface ASTRule {
  id: string
  query: string
  languages: string[]
  reason: string
  suggest?: string
  regexPreFilter: string
}

interface Policy {
  action: "delete" | "modify" | "execute" | "read"
  include: string[]
  exclude: string[]
  description: string
  commandRules?: CommandRule[]
  contentRules?: ContentRule[]
  astRules?: ASTRule[]
}

// Policy storage locations
const VETO_CONFIG_DIR = join(homedir(), ".config", "veto")
const POLICIES_FILE = join(VETO_CONFIG_DIR, "policies.json")

// Load policies from veto-leash config
function loadPolicies(): Policy[] {
  try {
    if (existsSync(POLICIES_FILE)) {
      const data = JSON.parse(readFileSync(POLICIES_FILE, "utf-8"))
      return data.policies?.map((p: { policy: Policy }) => p.policy) || []
    }
  } catch {
    // Ignore errors
  }
  return []
}

// Simple glob matching
function matchGlob(text: string, pattern: string): boolean {
  const normalized = text.toLowerCase()
  const pat = pattern.toLowerCase()
  
  if (pat === "*") return true
  if (!pat.includes("*") && !pat.includes("?")) {
    return normalized === pat || normalized.startsWith(pat + " ")
  }
  
  // Convert glob to regex
  const regex = new RegExp(
    "^" + pat.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
  )
  return regex.test(normalized)
}

// Check command against rules
function checkCommand(command: string, policies: Policy[]): { blocked: boolean; reason?: string; suggest?: string } {
  for (const policy of policies) {
    if (!policy.commandRules) continue
    
    for (const rule of policy.commandRules) {
      for (const pattern of rule.block) {
        if (matchGlob(command, pattern)) {
          return {
            blocked: true,
            reason: rule.reason,
            suggest: rule.suggest,
          }
        }
      }
    }
  }
  return { blocked: false }
}

// Check file path against policies
function checkFilePath(filePath: string, policies: Policy[], action: string): { blocked: boolean; reason?: string } {
  const normalizedPath = filePath.replace(/\\/g, "/")
  const basename = normalizedPath.split("/").pop() || ""
  
  for (const policy of policies) {
    // Check if action matches
    const policyAction = policy.action
    if (action === "edit" && policyAction !== "modify") continue
    if (action === "read" && policyAction !== "read") continue
    
    // Check include patterns
    const matchesInclude = policy.include.some(pattern => 
      matchGlob(normalizedPath, pattern) || matchGlob(basename, pattern)
    )
    if (!matchesInclude) continue
    
    // Check exclude patterns
    const matchesExclude = policy.exclude.some(pattern =>
      matchGlob(normalizedPath, pattern) || matchGlob(basename, pattern)
    )
    if (matchesExclude) continue
    
    return {
      blocked: true,
      reason: `${policy.description}: ${filePath}`,
    }
  }
  
  return { blocked: false }
}

// Check content against rules (regex-based, fast check)
function checkContent(content: string, filePath: string, policies: Policy[]): { blocked: boolean; reason?: string; suggest?: string; line?: number } {
  const basename = filePath.split("/").pop() || ""
  
  for (const policy of policies) {
    if (!policy.contentRules) continue
    
    for (const rule of policy.contentRules) {
      // Check if file type matches
      const matchesType = rule.fileTypes.some(ft => {
        if (ft.startsWith("*.")) {
          return basename.endsWith(ft.slice(1))
        }
        return matchGlob(basename, ft)
      })
      if (!matchesType) continue
      
      // Check regex pattern
      try {
        const regex = new RegExp(rule.pattern, "gm")
        const match = regex.exec(content)
        if (match) {
          const beforeMatch = content.slice(0, match.index)
          const line = (beforeMatch.match(/\n/g) || []).length + 1
          return {
            blocked: true,
            reason: rule.reason,
            suggest: rule.suggest,
            line,
          }
        }
      } catch {
        // Invalid regex, skip
      }
    }
    
    // Check AST rules via regex pre-filter (fast path)
    if (policy.astRules) {
      for (const rule of policy.astRules) {
        if (rule.regexPreFilter && content.includes(rule.regexPreFilter)) {
          // For now, use regex pre-filter as indicator
          // Full AST checking would require loading tree-sitter
          // which adds significant overhead
          return {
            blocked: true,
            reason: rule.reason,
            suggest: rule.suggest,
          }
        }
      }
    }
  }
  
  return { blocked: false }
}

// Plugin context type (simplified)
interface PluginContext {
  project: unknown
  client: {
    app: {
      log: (opts: { service: string; level: string; message: string; extra?: unknown }) => Promise<void>
    }
    tui: {
      showToast: (opts: { message: string; variant: "info" | "success" | "error" | "warning" }) => Promise<void>
    }
  }
  $: unknown
  directory: string
  worktree: string
}

// Export the plugin
export const VetoLeash = async (ctx: PluginContext) => {
  const { client } = ctx
  const policies = loadPolicies()
  
  if (policies.length === 0) {
    // No policies, plugin is a no-op
    return {}
  }
  
  // Log plugin initialization
  await client.app.log({
    service: "veto-leash",
    level: "info",
    message: `Loaded ${policies.length} policies`,
  })
  
  return {
    // Intercept tool calls before execution
    "tool.execute.before": async (
      input: { tool: string },
      output: { args: Record<string, unknown> }
    ) => {
      const tool = input.tool
      const args = output.args
      
      // Check Bash commands
      if (tool === "bash" && args.command) {
        const result = checkCommand(String(args.command), policies)
        if (result.blocked) {
          // Show toast notification
          await client.tui.showToast({
            message: `Blocked: ${result.reason}`,
            variant: "error",
          })
          
          // Throw to block the tool
          const msg = result.suggest 
            ? `${result.reason}. Try: ${result.suggest}`
            : result.reason
          throw new Error(`veto-leash: ${msg}`)
        }
      }
      
      // Check file operations
      if ((tool === "edit" || tool === "write" || tool === "read") && args.filePath) {
        const action = tool === "read" ? "read" : "edit"
        const result = checkFilePath(String(args.filePath), policies, action)
        if (result.blocked) {
          await client.tui.showToast({
            message: `Blocked: ${result.reason}`,
            variant: "error",
          })
          throw new Error(`veto-leash: ${result.reason}`)
        }
      }
      
      // Check content for write/edit operations
      if ((tool === "edit" || tool === "write") && args.filePath) {
        const content = String(args.content || args.newString || "")
        if (content) {
          const result = checkContent(content, String(args.filePath), policies)
          if (result.blocked) {
            const lineInfo = result.line ? ` (line ${result.line})` : ""
            await client.tui.showToast({
              message: `Blocked${lineInfo}: ${result.reason}`,
              variant: "error",
            })
            
            const msg = result.suggest
              ? `${result.reason}${lineInfo}. Try: ${result.suggest}`
              : `${result.reason}${lineInfo}`
            throw new Error(`veto-leash: ${msg}`)
          }
        }
      }
    },
    
    // Listen for session events to show policy summary
    event: async ({ event }: { event: { type: string } }) => {
      if (event.type === "session.created") {
        // Optionally show active policies on session start
        // await client.tui.showToast({
        //   message: `veto-leash: ${policies.length} policies active`,
        //   variant: "info",
        // })
      }
    },
  }
}

// Default export for single-file plugin
export default VetoLeash
