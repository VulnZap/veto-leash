export default function App() {
  return (
    <div className="min-h-screen bg-black">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">veto</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="https://github.com/VulnZap/veto" className="text-sm text-white/60 hover:text-white transition">
              GitHub
            </a>
            <a href="https://github.com/VulnZap/veto/tree/master/docs" className="text-sm text-white/60 hover:text-white transition">
              Docs
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#f5a524] animate-pulse"></span>
            Now available on npm
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            The permission layer
            <br />
            <span className="gradient-text">for AI agents</span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-12">
            Control what AI agents can and cannot do. Guardrails for agentic applications and AI coding assistants.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <div className="font-mono text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-left">
              <span className="text-white/40">$</span> npm install <span className="text-[#f5a524]">veto-sdk</span>
            </div>
            <div className="font-mono text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-left">
              <span className="text-white/40">$</span> npm install -g <span className="text-[#f5a524]">veto-cli</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">The Problem</h2>
          <p className="text-white/60 text-lg mb-8">
            AI agents are powerful but unpredictable. Without guardrails, you're trusting the model to always do the right thing.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Execute arbitrary shell commands',
              'Modify or delete any file',
              'Access sensitive data',
              'Make network requests',
              'Run indefinitely without oversight',
              'Bypass security policies'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/60">
                <span className="text-red-500">x</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">The Solution</h2>
          <p className="text-white/60 text-lg mb-12">
            Veto intercepts AI agent actions before they execute and validates them against your rules.
          </p>

          <div className="font-mono text-sm bg-[#0a0a0a] border border-white/10 rounded-xl p-6 overflow-x-auto">
            <pre className="text-white/80">{`┌─────────────┐     ┌─────────┐     ┌──────────────┐
│  AI Agent   │────▶│  Veto   │────▶│  Your Tools  │
│  (LLM)      │     │ (Guard) │     │  (Handlers)  │
└─────────────┘     └─────────┘     └──────────────┘
                         │
                         ▼
                    ┌─────────┐
                    │  Rules  │
                    │  (YAML) │
                    └─────────┘`}</pre>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Two Products, One Mission</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* SDK */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 glow">
              <div className="text-[#f5a524] font-mono text-sm mb-4">veto-sdk</div>
              <h3 className="text-2xl font-bold mb-3">For Developers</h3>
              <p className="text-white/60 mb-6">
                Building agentic applications? Wrap your tools with Veto. Validation happens automatically.
              </p>
              <div className="font-mono text-xs bg-black/50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-white/70">{`import { Veto } from 'veto-sdk';

const veto = await Veto.init();
const { definitions, implementations } = 
  veto.wrapTools(myTools);`}</pre>
              </div>
            </div>

            {/* CLI */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 glow">
              <div className="text-[#f5a524] font-mono text-sm mb-4">veto-cli</div>
              <h3 className="text-2xl font-bold mb-3">For Teams</h3>
              <p className="text-white/60 mb-6">
                Using AI coding assistants? Control what Claude, Cursor, and Windsurf can do in your codebase.
              </p>
              <div className="font-mono text-xs bg-black/50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-white/70">{`# .veto
deny write .env* *.key
allow read **
ask exec rm* git push*`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Why Veto?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Zero Config', desc: 'Sensible defaults out of the box' },
              { title: 'Provider Agnostic', desc: 'OpenAI, Anthropic, Google, any LLM' },
              { title: 'Local First', desc: 'No cloud required, full control' },
              { title: 'Real-time TUI', desc: 'Monitor agent actions live' },
              { title: 'Team Policies', desc: 'Sync rules across your organization' },
              { title: 'Fast', desc: 'Sub-millisecond validation overhead' },
            ].map((feature, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Get Started</h2>
          <p className="text-white/60 mb-8">
            Install Veto and take control of your AI agents in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://github.com/VulnZap/veto" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition"
            >
              View on GitHub
            </a>
            <a 
              href="https://www.npmjs.com/package/veto-sdk" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 font-medium rounded-lg hover:bg-white/10 transition"
            >
              npm packages
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/40">
            Plaw, Inc.
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="https://github.com/VulnZap/veto" className="hover:text-white transition">GitHub</a>
            <a href="https://www.npmjs.com/package/veto-sdk" className="hover:text-white transition">npm</a>
            <a href="https://twitter.com/vetorun" className="hover:text-white transition">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
