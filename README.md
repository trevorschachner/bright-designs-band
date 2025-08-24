# Bright Designs Band

This is the official website and administrative dashboard for Bright Designs, a marching band show design company. This project is built with the Next.js App Router and serves as a catalog for shows, a portal for clients, and a tool for managing the business.

## Tech Stack

This project is built with a modern, full-stack TypeScript architecture.

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
*   **Authentication**: [Supabase Auth](https://supabase.com/auth) (with Magic Links)
*   **Transactional Emails**: [Resend](https://resend.com/)
*   **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js (v18 or later)
*   pnpm (or your preferred package manager)
*   A Supabase account and project
*   A Resend account for handling emails

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/bright-designs-band.git
    cd bright-designs-band
    ```

2.  **Install dependencies:**
    ```sh
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env.local
    ```
    You will need to populate this file with your credentials from Supabase and Resend.

4.  **Run the database migrations:**
    Ensure your Supabase database schema is up to date by running the Drizzle Kit push command:
    ```sh
    pnpm run db:push
    ```

5.  **Run the development server:**
    ```sh
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

The project follows a feature-centric architecture, organized to keep related logic together and maintain a clean separation of concerns.

*   **/app**: Contains all the routes and pages of the application, following the Next.js App Router convention.
    *   **/app/api**: All API routes are defined here, providing a backend for the application.
    *   **/app/(admin|auth|...)**: Route groups are used to structure different sections of the site.

*   **/components**: Contains all reusable React components.
    *   **/components/ui**: Core UI components, largely from shadcn/ui (Button, Card, etc.).
    *   **/components/features**: Larger, feature-specific components (e.g., components for the "shows" catalog, the "admin" dashboard, etc.).

*   **/lib**: Contains shared libraries, helper functions, and core business logic.
    *   **/lib/database**: Drizzle ORM schema, queries, and database connection logic.
    *   **/lib/supabase**: Supabase client configurations for server, client, and middleware.
    *   **/lib/filters**: Logic for the advanced filtering and sorting system used in the resource catalogs.

*   **/drizzle**: Holds the Drizzle ORM migration files and configuration.

*   **/supabase**: Contains Supabase-specific database migrations and configuration.

*   **/docs**: Project documentation, including setup guides and feature explanations.
