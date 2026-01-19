# BloxThumb 3D - Roblox Thumbnail Generator

An advanced AI-powered web application that generates high-quality 3D Roblox game thumbnails using Google's Gemini 3 Pro model.

## Features

*   **Text-to-Image Generation**: Create stunning thumbnails from text descriptions.
*   **Image-to-Image Reference**: Upload or paste a URL of a reference image to guide the composition.
*   **Style Presets**: Choose from Cinematic, Simulator, Obby, Horror, RPG, or Anime styles.
*   **R15 & Rthro Support**: Toggle between Blocky (R15) and Realistic (Rthro) avatar models.
*   **Real-time System Status**: Monitor API latency, storage usage, and system health.
*   **Persistent Gallery**: Generated images are saved automatically to your browser's local storage.
*   **Advanced Prompt Engineering**: Optimized system prompts ensure high-fidelity "Blender-style" renders.
*   **Responsive UI**: Dark mode, glassmorphism design built with Tailwind CSS.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgoogle-gemini%2Fblox-thumbnails)

1.  Click the **Deploy** button above.
2.  Import your Git repository.
3.  Deploy! (Configuration is automatic based on codebase).

## Local Development

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the app: `npm run dev`

## Technologies Used

*   React 19
*   Vite
*   TypeScript
*   Tailwind CSS
*   Google GenAI SDK (`@google/genai`)

## Usage

1.  Select your desired aesthetic style (e.g., High-CTR for YouTube).
2.  Choose your Avatar Model: **R15** (Classic Blocky) or **Rthro** (Realistic).
3.  (Optional) Enter a Roblox Username to sync the exact avatar appearance.
4.  Click Generate.
