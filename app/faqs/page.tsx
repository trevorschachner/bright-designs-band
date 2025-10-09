export default function FaqsPage() {
  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center mb-6 font-primary text-foreground">Frequently Asked Questions</h1>
      <div className="max-w-3xl mx-auto frame-card p-6">
        <p className="text-lg text-center mb-6 text-muted-foreground">Common questions our clients ask.</p>
        <ul className="list-better">
          <li>
            <div>
              <strong>How long does a custom show take?</strong>
              <p className="text-sm text-muted-foreground mt-1">Typically 6–12 weeks depending on scope and timeline.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Can you adapt for different ensemble sizes?</strong>
              <p className="text-sm text-muted-foreground mt-1">Yes, our arrangements scale from small to large programs.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Do you provide rehearsal resources?</strong>
              <p className="text-sm text-muted-foreground mt-1">We include scores, parts, and audio as needed.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
} 