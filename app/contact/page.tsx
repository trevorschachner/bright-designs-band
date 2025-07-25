export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-5xl font-bold mb-6 font-primary text-bright-dark">Contact Us</h1>
      <p className="text-lg max-w-2xl mb-8 text-gray-600">
        Reach out at <a href="mailto:hello@brightdesigns.band" className="text-bright-third hover:underline">hello@brightdesigns.band</a>
        <br />
        or call (555) 123-4567.
      </p>
    </div>
  )
}