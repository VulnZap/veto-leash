import { Claude, Cursor, Windsurf, GithubCopilot, LangChain, Anthropic, OpenAI, Groq, HuggingFace } from '@lobehub/icons'
import { IconBrandChrome } from '@tabler/icons-react'
import { Marquee } from '@/components/ui/marquee'

export function Integrations() {
  const logos = [
    { icon: Claude },
    { icon: Cursor },
    { icon: Windsurf },
    { icon: GithubCopilot },
    { icon: LangChain },
    { icon: Anthropic },
    { icon: OpenAI },
    { icon: Groq },
    { icon: HuggingFace },
    { icon: IconBrandChrome }, // browser-use
  ]

  return (
    <section className="py-16 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h2 className="text-section font-medium tracking-tight text-foreground mb-8 text-center">
          Works with the agents you already use.
        </h2>

        {/* Marquee */}
        <div className="relative overflow-hidden">
          <Marquee pauseOnHover className="py-2">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-20 h-12 rounded border border-border bg-surface hover:border-border-subtle transition-colors"
              >
                <logo.icon size={24} className="text-muted-foreground" />
              </div>
            ))}
          </Marquee>

          {/* Edge Fades */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>

        {/* SDK Callout */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Python SDK · TypeScript SDK · Any tool-calling LLM
          </p>
        </div>
      </div>
    </section>
  )
}
