/**
 * The FAQ copy, in one place: `/faqs` renders it, its FAQPage schema is built
 * from it, and `/llms-full.txt` publishes it. Edit the copy here only.
 */

export type Faq = { question: string; answer: string }
export type FaqSection = { category: string; items: Faq[] }

export const FAQ_SECTIONS: FaqSection[] = [
  {
    category: 'Getting Started',
    items: [
      {
        question: 'How do I get started with Bright Designs?',
        answer: 'The easiest way is to fill out our contact form or reach out directly. We use organized intake forms and documents to walk you through everything we need — you don\'t have to figure it out on your own. We\'ll gather information about your band size, skill level, timeline, competitive goals, and any theme ideas before we dive in.',
      },
      {
        question: 'What information do you need to design a custom show?',
        answer: 'We start with a detailed intake — band size, instrumentation, skill level, competitive circuit, season timeline, budget range, and any theme or concept ideas you already have. Don\'t worry if you\'re not sure about all of it yet; we help you work through it with guiding documents and a consultation call.',
      },
      {
        question: 'Do you work with bands outside South Carolina?',
        answer: 'Yes — we work with programs nationwide across all competitive circuits and levels. Distance is no barrier. Most of our collaboration happens remotely through video calls, shared documents, and audio/score deliveries.',
      },
    ],
  },
  {
    category: 'Shows & Design',
    items: [
      {
        question: 'How long does a custom show take?',
        answer: 'Typically 6–12 weeks depending on scope and your timeline. Full custom productions with multiple movements take longer than a single arrangement. We\'ll set clear milestones and delivery dates upfront so you always know what\'s coming and when.',
      },
      {
        question: 'Can you adapt shows for different ensemble sizes?',
        answer: 'Yes. Our arrangements scale from small bands to large programs. We write specifically to your instrumentation and ability level — not a one-size-fits-all template.',
      },
      {
        question: 'Can we buy a show or arrangement from your site?',
        answer: 'Yes. Every show and every arrangement on our site is for sale. There are three ways to buy: a full show, as it is on the site; build your own show by mixing arrangements from different shows; or partial custom, where we write a few new pieces for your band and pair them with existing arrangements. Talk to us and we\'ll help you pick.',
      },
      {
        question: 'Can multiple bands perform the same catalog show?',
        answer: 'Custom shows are always exclusive to your program. For catalog shows, we ensure regional exclusivity so you won\'t compete against another band performing the same production in your circuit.',
      },
    ],
  },
  {
    category: 'Process & Revisions',
    items: [
      {
        question: 'What does the design process look like?',
        answer: 'We start with a consultation, then contracts, then concept development. From there we move into design drafts with regular delivery checkpoints. You give feedback throughout — this is a collaborative process, not a one-and-done delivery. We finish with final materials and stay available for support all season.',
      },
      {
        question: 'How many rounds of revisions are included?',
        answer: 'We work collaboratively throughout the process, so revisions aren\'t limited to a set number of "rounds." We deliver drafts, collect your feedback, and keep refining until it\'s right. Clear communication at each stage means we rarely have to go back to square one.',
      },
      {
        question: 'What if we need changes mid-season?',
        answer: 'We support you throughout the season. If something isn\'t working on the field, reach out and we\'ll work through it with you — whether that\'s a musical adjustment, pacing change, or a staging fix.',
      },
    ],
  },
  {
    category: 'Music & Licensing',
    items: [
      {
        question: 'Do you handle music licensing, or does the band need to do that?',
        answer: 'We can handle it for you, or guide you through doing it yourself — whichever you prefer. Licensing requirements vary by circuit (BOA, WGI, state associations all have different rules), and we\'re familiar with what each requires.',
      },
      {
        question: 'What formats do you deliver?',
        answer: 'It depends on what\'s ordered. A full custom show typically includes scores, individual parts, audio recordings, and drill files. We\'ll confirm exactly what\'s included in your package upfront.',
      },
      {
        question: 'Do you provide rehearsal resources?',
        answer: 'Yes. Scores, parts, and audio are included as needed. We want your students to be prepared, so we provide materials that are clear and teachable from day one.',
      },
    ],
  },
  {
    category: 'Pricing & Availability',
    items: [
      {
        question: 'How much does a show cost?',
        answer: 'We don\'t list prices. It depends on how you buy (a full show, your own mix of arrangements, or partial custom with new pieces), your band size, and what services you need. Reach out and we\'ll put together a quote that fits your budget.',
      },
      {
        question: 'What competitive circuits do you have experience with?',
        answer: 'All levels — from BOA and WGI to state and regional associations. Whether you\'re competing at a local festival or a national championship, we know what judges look for and design accordingly.',
      },
    ],
  },
]

/** Every FAQ in page order, for the FAQPage schema and llms-full.txt. */
export const FAQS: Faq[] = FAQ_SECTIONS.flatMap((section) => section.items)
