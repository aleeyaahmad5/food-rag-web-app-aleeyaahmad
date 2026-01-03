# Development Guide

## Project Background

This Next.js web application is the culmination of a multi-week AI development journey:

| Week | Milestone | Technology |
|------|-----------|------------|
| Week 2 | Local RAG System | Python + ChromaDB + Ollama |
| Week 3 | Cloud Migration | Python + Upstash + Groq (29.4x faster) |
| Week 4-5 | Web Application | Next.js + TypeScript + Vercel |

The Python reference implementations are preserved in `/python-reference` for educational purposes and comparison.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommended: 20.x)
- **pnpm** (recommended) or npm/yarn
- **Git**

## Required Accounts & API Keys

1. **Upstash Account** - For Vector Database
   - Sign up at [upstash.com](https://upstash.com)
   - Create a Vector Index
   - Get your REST URL and Token

2. **Groq Account** - For LLM API
   - Sign up at [console.groq.com](https://console.groq.com)
   - Generate an API key

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aleeyaahmad5/food-rag-web-app-aleeyaahmad.git
cd food-rag-web-app-aleeyaahmad
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Upstash Vector Database
UPSTASH_VECTOR_REST_URL=https://your-index.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token

# Groq API
GROQ_API_KEY=gsk_your_groq_api_key
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
food-rag-web-app/
├── app/                    # Next.js App Router (Week 4-5)
│   ├── actions.ts          # Server actions
│   ├── api/chat/route.ts   # Streaming API
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── food-chat.tsx       # Main chat component
│   ├── header.tsx          # Header navigation
│   ├── footer.tsx          # Footer
│   ├── particle-background.tsx
│   ├── theme-provider.tsx
│   └── ui/                 # Shadcn UI components
├── docs/                   # Documentation
├── lib/                    # Utilities
├── public/                 # Static assets
├── python-reference/       # Python RAG Systems (Week 2-3)
│   ├── local-version/      # ChromaDB + Ollama (~24s/query)
│   ├── cloud-version/      # Upstash + Groq (~0.8s/query)
│   └── docs/               # Migration documentation
└── styles/                 # Additional styles
```

## Key Files Explained

### `app/actions.ts`
Server action for non-streaming RAG queries. Handles:
- Vector search via Upstash
- Context building from results
- LLM response generation via Groq
- Performance metrics tracking

### `app/api/chat/route.ts`
API route for streaming responses. Uses:
- Vercel AI SDK for streaming
- @ai-sdk/groq for Groq integration
- Custom headers for metadata delivery

### `components/food-chat.tsx`
Main chat interface component. Features:
- Message history management
- Conversation persistence (localStorage)
- Streaming toggle
- Performance metrics display
- Social sharing buttons

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Type checking
pnpm tsc --noEmit
```

## Adding New Features

### Adding a New Server Action

1. Open `app/actions.ts`
2. Add your new function with `"use server"` directive
3. Export the function

```typescript
export async function myNewAction(param: string) {
  // Your logic here
}
```

### Adding a New UI Component

1. Create file in `components/`
2. Use "use client" directive if client-side interactivity needed
3. Import and use in pages/components

```typescript
"use client"

export function MyComponent() {
  return <div>My Component</div>
}
```

### Adding a New API Route

1. Create folder in `app/api/`
2. Add `route.ts` file
3. Export HTTP method handlers

```typescript
export async function GET(request: Request) {
  return Response.json({ message: "Hello" })
}
```

## Styling Guidelines

- Use **Tailwind CSS** utility classes
- Follow existing color scheme (blue/indigo gradients)
- Support both light and dark modes
- Use Shadcn UI components where applicable

## Testing Locally

### Test the Chat Interface
1. Start dev server
2. Type a question like "What fruits are tropical?"
3. Verify response, sources, and metrics appear

### Test Streaming
1. Toggle "Streaming On" in the UI
2. Submit a query
3. Observe real-time text appearance

### Test Conversation History
1. Send multiple queries
2. Refresh the page
3. Verify conversations persist

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy automatically

### Manual Deployment

```bash
# Build the application
pnpm build

# The output is in .next/ directory
# Deploy to your preferred hosting platform
```

## Troubleshooting

### "UPSTASH_VECTOR_REST_TOKEN is missing!"
- Ensure `.env.local` file exists
- Check environment variable names are correct
- Restart the development server

### "Failed to process your question"
- Verify API keys are valid
- Check network connectivity
- Review server logs for details

### Streaming Not Working
- Ensure `/api/chat` route is accessible
- Check browser console for errors
- Verify Vercel AI SDK is installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Upstash Vector Docs](https://upstash.com/docs/vector)
- [Groq API Docs](https://console.groq.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

## Python Reference (Weeks 2-3)

This web application is built on top of Python RAG systems developed in earlier weeks. The `/python-reference` folder contains:

### Local Version (Week 2)
- **Technology:** ChromaDB + Ollama (llama3.2)
- **Performance:** ~24 seconds/query
- **Database:** 90 food items
- **Documentation:** [python-reference/local-version/README.md](../python-reference/local-version/README.md)

### Cloud Version (Week 3)
- **Technology:** Upstash Vector + Groq
- **Performance:** ~0.8 seconds/query (29.4x faster)
- **Database:** 110 food items
- **Documentation:** [python-reference/README.md](../python-reference/README.md)

### Migration Documentation
- **Migration Plan:** [python-reference/docs/MIGRATION_PLAN.md](../python-reference/docs/MIGRATION_PLAN.md)
- **Test Results:** [python-reference/cloud-version/TEST_RESULTS.md](../python-reference/cloud-version/TEST_RESULTS.md)

To run the Python versions locally, see the README files in each subfolder.
