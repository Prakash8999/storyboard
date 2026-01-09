# Storyboard - Visual Storytelling, Simplified

**Storyboard** is a modern, web-based application designed to help creators plan, script, and visualize their video projects. From loglines to detailed shot lists, everything you need to organize your pre-production workflow is in one place.

![App Screenshot](https://via.placeholder.com/800x400.png?text=Storyboard+App+Interface)

## 🚀 Features

### 📋 Project Management
*   **Dashboard**: Organize all your video projects in a clean, grid-based dashboard.
*   **Status Tracking**: Track project progress (Idea, Writing, Storyboard, Done).

### ✍️ Creative Workspace
A flexible, 3-column workspace that adapts to your workflow. Toggle panels on or off to focus on what matters.

1.  **The Idea**: Craft your logline and define the core status of your project.
2.  **Script Editor**: A dedicated area for writing your screenplay and notes.
3.  **Scene & Shot Planning**:
    *   **Scene List**: Break down your script into manageable scenes.
    *   **Shot List**: Drill down into each scene to plan individual shots.
    *   **Visuals**: Attach reference images (via Cloudinary upload or URL) to every shot.

### 🎬 Storyboard Mode
*   **Visual Grid**: Switch to a "Storyboard" view to see a bird's-eye view of all your shots in sequence.
*   **Visualization**: Perfect for checking the visual flow and pacing of your video.

### 🔐 Secure & Cloud-Based
*   **Authentication**: Secure login and registration powered by Firebase Auth.
*   **Real-time Data**: All your scripts and plans are instantly saved and synced via Firebase Firestore.
*   **Media Storage**: Images are securely hosted on Cloudinary.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Backend / DB**: [Firebase](https://firebase.google.com/) (Auth & Firestore)
*   **Image Storage**: [Cloudinary](https://cloudinary.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

### Prerequisites

*   Node.js installed
*   A Firebase project (Auth & Firestore enabled)
*   A Cloudinary account

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/storyboard.git
    cd storyboard
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your keys:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to start creating!

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
