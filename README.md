# Gemini Image Studio

Gemini Image Studio is a powerful, high-fidelity AI image generation and editing suite powered by Google's latest Gemini and Imagen models. It provides a professional-grade interface for creative neural synthesis, allowing users to generate stunning artwork, perform multi-turn conversational edits, and utilize reference images for precise artistic control.

## 🚀 Features

*   **Advanced AI Engines**: Support for Gemini 3 Pro Image, Gemini 2.5 Flash, and Imagen 4.0.
*   **Multi-Turn Editing**: Refine and modify existing images through conversational prompts (Rewrite Reality).
*   **Reference Image Support**: Upload up to 14 reference images to guide the AI's creative process.
*   **Style Matrix**: Instant application of curated style presets like Cyberpunk, Liquid Glass, Ethereal Dream, and Noir Cinema.
*   **Professional Controls**:
    *   **Aspect Ratio**: 1:1, 4:3, 3:4, 16:9, 9:16.
    *   **Neural Precision**: Generate in 1K, 2K, or 4K resolution (Pro models).
    *   **Google Search Grounding**: Enable real-time search grounding for the Pro engine.
*   **Visual History**: Track your creative journey with a dynamic art gallery, download options, and variation generation.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Build Tool**: Vite
*   **AI Framework**: Google Gemini AI (`@google/genai`)
*   **Styling**: Tailwind CSS, Custom Glassmorphism UI
*   **Deployment**: GitHub Pages

## 📦 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/gemini-image-studio.git
    cd gemini-image-studio
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    VITE_API_KEY=your_gemini_api_key_here
    ```

4.  **Launch Development Server**:
    ```bash
    npm run dev
    ```

## 🔑 Configuration

To use the application, you need a **Google Gemini API Key**.
*   Obtain a key from the [Google AI Studio](https://aistudio.google.com/).
*   The application expects the key to be provided via the `VITE_API_KEY` environment variable for production builds and local development.

## 🚀 Deployment

This project is configured for automated deployment to **GitHub Pages**.

1.  **GitHub Secrets**:
    Add your `VITE_API_KEY` to your GitHub repository secrets to ensure the build process has access to it:
    - Go to your repository on GitHub.
    - Navigate to **Settings > Secrets and variables > Actions**.
    - Click **New repository secret**.
    - Name: `VITE_API_KEY`
    - Value: `your_actual_api_key`

2.  **Automated Workflow**:
    The project includes a GitHub Action workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that automatically builds and deploys the application to GitHub Pages whenever you push changes to the `main` branch.
