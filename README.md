<div align="center">

# ⚡ ContextCrafter

### The Intelligent Codebase Context Engine & AI Developer Platform

**Turn any repository into an interactive, deeply indexed, and AI-powered knowledge graph.**  
ContextCrafter indexes your codebase, generates living architectural diagrams, extracts dependencies and models, and provides hyper-accurate RAG-driven AI code reviews, chat, debt analysis, and documentation.

---

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

</div>

---

## 🚀 Overview

Modern software engineering involves navigating sprawling codebases, complex module dependencies, and undocumented architecture decisions. **ContextCrafter** bridges the gap between raw Git repositories and actionable AI intelligence.

By parsing Abstract Syntax Trees (ASTs), indexing file graphs, and calculating semantic embeddings, ContextCrafter equips engineering teams with a real-time copilot that understands full-project context—not just isolated files.

```
                  ┌─────────────────────────────────────────┐
                  │          Connected Repository           │
                  │       (GitHub / GitLab / Local)         │
                  └────────────────────┬────────────────────┘
                                       │
                         [AST & Dependency Parser]
                                       │
                  ┌────────────────────▼────────────────────┐
                  │      ContextCrafter Knowledge Core      │
                  ├────────────────────┬────────────────────┤
                  │  • Architecture    │  • DB Models       │
                  │  • API Endpoints   │  • UI Components   │
                  │  • Vector Embeds   │  • Tech Debt Index │
                  └────────────────────┬────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Multi-LLM RAG   │         │ Automated PR &   │         │ Live Architecture│
│  Context Chat    │         │ Code Reviewer    │         │ Interactive Graph│
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

## ✨ Key Features

### 1. 🧠 Dynamic Multi-Provider AI Engine
- **Pluggable LLM Backends**: Seamlessly toggle between **Groq (Llama-3.3-70B / 8B)**, **OpenAI (GPT-4o / GPT-4o-mini)**, **Ollama (Self-hosted local models)**, and **DeepInfra**.
- **User Custom Keys**: Support for enterprise or personal API keys saved securely per user with runtime fallback to system-configured models.
- **RAG & Semantic Code Search**: Vector-based semantic search with exact file citations and line-range highlights.

### 2. 🗺️ Living Architecture & Dependency Maps
- **Interactive Visual Flow**: Pan, zoom, and explore nodes representing frontend components, backend endpoints, database schemas, and external APIs.
- **Automatic Entity Detection**: Categorizes components, REST/GraphQL APIs, database models, and internal libraries.
- **Real-time Sync**: Automated branch polling and webhook-driven incremental re-indexing.

### 3. 🔍 Automated PR & Code Review Engine
- **Instant Pull Request Audits**: Automated diff analysis against project conventions.
- **Severity Scoring**: Categorizes issues into *Critical*, *Warning*, and *Optimization*.
- **Direct Fix Suggestions**: Generates drop-in code snippets to remediate security flaws, type errors, or anti-patterns.

### 4. 📉 Technical Debt & Architecture Health
- **Codebase Health Metrics**: Calculates overall maintainability, architectural cohesion, and risk scores.
- **Refactoring Estimator**: Identifies tightly coupled modules, circular imports, and high-cyclomatic complexity areas with estimated remediation hours.
- **Conventions & Standards Enforcement**: Audits code against team rules, naming conventions, and file structure rules.

### 5. 📚 Automated Living Documentation
- **Architecture Blueprints**: High-level overviews generated on-demand for onboarding new developers.
- **API Reference Guides**: Auto-generated documentation for all public endpoints, parameters, and responses.
- **Export & Markdown Sync**: Direct export of generated docs to GitHub Wiki or markdown artifacts.

### 6. 👥 Team Collaboration & Real Email Invites
- **Role-Based Access Control**: Assign granular permissions (*Owner*, *Admin*, *Developer*, *Viewer*).
- **Dual-Engine Email Delivery**: Priority Gmail SMTP (`smtp.gmail.com`) with automated fallback to Resend API (`onboarding@resend.dev`) to prevent delivery failures.
- **Secure Token Onboarding**: Unique, timestamped invitation links with instant workspace acceptance.

### 7. 🔌 Webhooks & Third-Party Integrations
- **Git Platforms**: GitHub Apps / Personal Access Tokens and GitLab API token verification.
- **Team Communications**: Real-time webhook notifications for Slack channels and Discord servers on repo sync, security vulnerabilities, and code reviews.
- **Issue Tracking**: Jira Cloud integration for automated issue creation from technical debt audits.

### 8. 🔑 Developer API Keys & Extensibility
- **Cryptographic Key Generation**: SHA-256 hashed API keys (`cc_live_...`) for CI/CD integration and programmatic queries.
- **Scoped Permissions**: Restrict tokens to `read-only`, `repo:sync`, or `full-access`.

### 9. 💳 Billing & Payment Gateway
- **Stripe Checkout & Billing Portal**: Self-service subscription management for Developer, Team, and Enterprise plans.
- **In-App Payment Gateway**: Interactive credit/debit card processing with instant activation.
- **PDF & Printable Invoices**: Generated invoices with itemized tax breakdowns and unique invoice numbering (`INV-YYYY-XXXXXX`).

### 10. 🎨 High-Contrast Adaptive Themes
- **Dark Obsidian (Default)**: Deep obsidian `#0b1326` canvas with indigo & periwinkle accents.
- **Cyber Neon (`cyber-blue`)**: Electric cyan `#38bdf8` on futuristic `#040b17` space background.
- **Midnight Violet (`deep-violet`)**: Deep purple `#090314` ambiance with fuchsia highlights.
- **Zero-Flicker Prehydration**: Synchronized instantly via `<head>` script, `localStorage`, and PostgreSQL user settings.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 15 (App Router)](https://nextjs.org), [React 19](https://react.dev) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com), [Lucide Icons](https://lucide.dev), [Google Fonts (Geist & Inter)](https://fonts.google.com) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org), [Prisma ORM 6.x](https://www.prisma.io) |
| **Authentication** | [NextAuth.js v5 / Auth.js](https://authjs.dev) (GitHub OAuth & Credentials) |
| **AI & Inference** | [Groq SDK](https://groq.com), [OpenAI SDK](https://openai.com), [Ollama](https://ollama.com), [DeepInfra](https://deepinfra.com) |
| **Email Services** | [Nodemailer (Gmail SMTP)](https://nodemailer.com), [Resend](https://resend.com) |
| **Payments & Billing** | [Stripe](https://stripe.com) |
| **Runtime & Tooling** | [Node.js 20+](https://nodejs.org), TypeScript 5, Turbopack |

---

## 📦 Project Structure

```
contextcrafter/
├── app/
│   ├── api/                           # Next.js API Route Handlers
│   │   ├── auth/                      # NextAuth session & OAuth handlers
│   │   ├── billing/                   # Stripe checkout, portal, webhook & invoices
│   │   ├── notifications/             # Live notification aggregation
│   │   ├── repos/                     # Repository analysis, chat, reviews & debt
│   │   └── setting/                   # Team, API keys, integrations, themes & profile
│   ├── dashboard/                     # Authenticated Dashboard Application
│   │   ├── repositories/              # Repository detail views & sub-tools
│   │   │   └── [repoId]/
│   │   │       ├── chat/              # RAG-powered codebase chat
│   │   │       ├── code-review/       # PR diff analysis & reviews
│   │   │       ├── debt/              # Technical debt & refactoring auditor
│   │   │       ├── documentation/     # Living documentation generator
│   │   │       ├── conventions/       # Code standards auditor
│   │   │       └── setting/           # Repository settings & preferences
│   │   └── DashboardLayoutClient.tsx  # Topbar, notifications, theme switch & navigation
│   ├── invite/[token]/                # Team invite acceptance landing page
│   ├── globals.css                    # Tailwind CSS v4 & theme design tokens
│   └── layout.tsx                     # Root layout with pre-hydration theme script
├── lib/
│   ├── ai.ts                          # Dynamic multi-provider AI engine
│   ├── auth.ts                        # Auth.js / NextAuth configuration
│   ├── db.ts                          # Prisma client singleton
│   ├── email.ts                       # Dual-engine SMTP & Resend email delivery
│   ├── github.ts                      # GitHub API octokit client
│   ├── rag.ts                         # Semantic vector search & RAG engine
│   └── stripe.ts                      # Stripe SDK & subscription plan matrix
├── prisma/
│   └── schema.prisma                  # PostgreSQL schema definition
└── public/                            # Static assets and brand icons
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL Database**: Local PostgreSQL or cloud instance (Supabase, Neon, AWS RDS)
- **Git**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/contextcrafter.git
cd contextcrafter
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and populate the required keys:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/contextcrafter?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/contextcrafter?schema=public"

# NextAuth / Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-random-key"

# GitHub OAuth App
GITHUB_ID="your_github_oauth_client_id"
GITHUB_SECRET="your_github_oauth_client_secret"
GITHUB_ACCESS_TOKEN="optional_personal_access_token_for_higher_rate_limits"

# AI Providers (At least one recommended)
GROQ_API_KEY="gsk_..."
OPENAI_API_KEY="sk-..."
DEEPINFRA_API_KEY="..."
OLLAMA_BASE_URL="http://127.0.0.1:11434"

# Email Services (Team Invitations)
# Dual Engine: Gmail SMTP is prioritized; Resend serves as fallback
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-gmail-app-password"
SMTP_FROM="ContextCrafter <your-email@gmail.com>"
RESEND_API_KEY="re_..."

# Stripe Payments & Invoices (Optional for Billing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Database Migration & Prisma Client
```bash
# Push the schema to your PostgreSQL database
npx prisma db push

# Generate the type-safe Prisma client
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using ContextCrafter!

---

## 🧩 Database Schema Overview

```mermaid
erDiagram
    User ||--o{ Repository : owns
    User ||--o{ ApiKey : generates
    User ||--o{ TeamMember : invites
    User ||--o{ Invoice : billed
    User ||--o| UserSettings : configures
    Repository ||--o{ ChatSession : contains
    Repository ||--o{ Decision : logs
    ChatSession ||--o{ ChatMessage : records

    User {
        string id PK
        string email UK
        string name
        string image
        string githubUsername
    }

    Repository {
        string id PK
        int githubId UK
        string name
        string fullName
        string branch
        int healthScore
        int aiScore
        RepoStatus status
    }

    ApiKey {
        string id PK
        string key UK
        string status
        datetime expiresAt
    }

    TeamMember {
        string id PK
        string email
        string role
        string inviteToken UK
        string status
    }

    UserSettings {
        string id PK
        string themeMode
        string syntaxTheme
        string defaultLlmProvider
        string customApiKey
        string subscriptionPlan
        json integrations
    }

    Invoice {
        string id PK
        string invoiceNumber UK
        int amountPaid
        string plan
        string status
    }
```

---

## 🔒 Security & Privacy

- **Data Isolation**: Repositories, vector embeddings, and API keys are strictly scoped per authenticated user or team organization.
- **Key Encryption**: API keys and external access tokens are hashed or encrypted at rest.
- **Private Repository Support**: Access tokens for private repositories are never logged or exposed to the client.

---

## 🤝 Contributing

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ for developers by developers.**  
*Empower your development workflow with deep codebase intelligence.*

</div>
