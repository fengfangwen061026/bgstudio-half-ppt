# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Start production server after build: `npm run start`
- Lint: `npm run lint`

There is no committed unit test runner or npm test script. Some ignored local smoke scripts may exist in a working tree; if present, run them against a live server, for example `BASE_URL=http://127.0.0.1:3000 node api-smoke.mjs`.

## Required environment

The app calls OpenAI-compatible APIs for text outline generation and image generation:

- `IMAGE2_API_KEY` and `IMAGE2_API_BASE_URL` are required for image generation.
- `IMAGE2_MODEL` defaults to `gpt-image-2`.
- `TEXT_MODEL_API_KEY`, `TEXT_MODEL_BASE_URL`, and `TEXT_MODEL_NAME` can override the text model used for outline generation. If unset, outline generation falls back to the `IMAGE2_*` base URL/key and model name `gpt-5.4`.
- `MAX_IMAGE_CONCURRENCY` controls parallel slide image generation, defaulting to up to 10 concurrent requests.
- `NEXT_PUBLIC_BASE_PATH` should match the deployed base path when client fetches and generated download/image URLs need a prefix. `next.config.ts` currently sets `basePath: "/ppt"`.

## Architecture overview

This is a Next.js App Router project for generating a complete PPT deck from user input. The UI is a single client component in `app/page.tsx`: users enter a topic/materials, upload optional attachments, request an editable outline, confirm generation, poll job status, preview generated slide images, and download the final `.pptx`.

The server API is split into small route handlers:

- `app/api/uploads/route.ts` extracts text from `.txt`, `.md`, `.pdf`, and `.docx` uploads.
- `app/api/outline/route.ts` validates outline input and returns a normalized deck outline.
- `app/api/ppt/jobs/route.ts` creates an async PPT generation job.
- `app/api/ppt/jobs/[jobId]/route.ts` returns job status for polling.
- `app/api/ppt/jobs/[jobId]/images/[slideId]/route.ts` serves generated slide PNGs.
- `app/api/ppt/jobs/[jobId]/download/route.ts` serves the finished PowerPoint file.

Core logic lives in `lib/`:

- `lib/schemas.ts` defines Zod schemas and shared TypeScript types for outlines, slides, and jobs. Keep API request/response shapes aligned here first.
- `lib/outline.ts` calls the text model, normalizes model JSON into the schema, and enforces the requested page count.
- `lib/prompts.ts` contains outline prompts, style presets, template prompts, and per-slide image prompts. Style changes usually belong here before changing API/job code.
- `lib/image2.ts` calls the OpenAI-compatible image generations endpoint and accepts base64, image URL, or image content responses.
- `lib/jobs.ts` manages async job creation, persisted job state, image generation concurrency, template-first style consistency, and final download/image URLs.
- `lib/pptx.ts` builds a 16:9 PPTX where each generated image fills one slide.
- `lib/attachments.ts` handles attachment text extraction through `mammoth` and `pdf-parse`.

Generated runtime files are stored under `.storage/jobs/<jobId>/` and are intentionally ignored by Git. Each job writes `job.json`, generated PNGs, an optional `template.png`, and `result.pptx`.

## Implementation notes

- Preserve the `/ppt` deployment base path behavior: client fetches in `app/page.tsx` use `NEXT_PUBLIC_BASE_PATH`, and server-generated job URLs in `lib/jobs.ts` use the same value.
- The generation pipeline intentionally creates a blank template first, then passes the template API `revised_prompt` as the style reference for every slide. Keep this flow unless deliberately changing visual consistency behavior.
- The UI and routes assume jobs are persisted on the local filesystem, not in a database or queue. Long-running generation starts in-process from `createPptJob`; this matters for serverless or multi-instance deployments.
- `package-lock.json` is present, so use npm for dependency changes.
