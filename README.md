# CleanScroll AI 🧹🤖

**Tired of doomscrolling? Take control of your Twitter/X feed with AI!**

CleanScroll AI is a Chrome extension that uses the power of Large Language Models (like GPT) to filter your timeline based on *your* rules. Define simple prompts, and the AI will automatically identify and hide tweets matching those criteria, giving you a cleaner, more focused scrolling experience.

![Demo Placeholder](placeholder.gif) <!-- TODO: Replace with an actual demo GIF! -->

## ✨ Key Features

*   **AI-Powered Filtering:** Leverages OpenAI's models to understand tweet content semantically.
*   **Customizable Prompts:** You define what gets hidden! Add simple questions (prompts) like "Is this tweet political?" or "Is this tweet hate speech?".
*   **Intelligent Hiding:** Matching tweets are covered with an unobtrusive overlay.
*   **"Show Anyway" Option:** Easily reveal hidden tweets with a single click if you change your mind.
*   **Secure API Key Storage:** Your OpenAI API key is stored locally and securely using Chrome's storage sync.
*   **Easy Configuration:** Manage your API key and filter prompts through a clean options page.

## 🤔 How It Works

1.  **You Define Prompts:** In the extension options, you create a list of questions (e.g., "Is this tweet about celebrity gossip?").
2.  **Extension Scans Tweets:** As you scroll, the extension extracts the text from tweets appearing on your timeline.
3.  **AI Analysis:** For each tweet, the extension sends the text and *each* of your prompts to the OpenAI API (using your API key), asking if the tweet matches the prompt's criteria (expecting a YES/NO answer).
4.  **Overlay Applied:** If the AI answers "YES" for *any* of your prompts regarding a specific tweet, that tweet gets covered by the CleanScroll AI overlay.
5.  **Reveal on Demand:** You can click the "Show Tweet Anyway" button on the overlay to view the hidden content.

## 🚀 Setup & Installation

1.  **Clone or Download:** Get the extension code:
    *   Clone: `git clone https://github.com/yask123/CleanScroll-AI-.git`
    *   Download: Download the ZIP file from the GitHub repository page and unzip it.
2.  **Open Chrome Extensions:** Navigate to `chrome://extensions/` in your Chrome browser.
3.  **Enable Developer Mode:** Ensure the "Developer mode" toggle (usually in the top-right corner) is switched ON.
4.  **Load Unpacked:** Click the "Load unpacked" button.
5.  **Select Directory:** Choose the folder where you cloned or unzipped the extension files (the folder containing `manifest.json`).
6.  **Add OpenAI API Key:**
    *   You need an API key from OpenAI. You can get one [here](https://platform.openai.com/account/api-keys).
    *   Right-click the CleanScroll AI extension icon (it might look like a puzzle piece initially) in your Chrome toolbar and select "Options".
    *   Paste your API key into the designated field and click "Save Key".

## ⚙️ Usage

*   **Configure Options:** Right-click the extension icon and choose "Options" to:
    *   Add/Update your OpenAI API key.
    *   Add new exclusion prompts (questions the AI will answer about each tweet).
    *   Remove existing prompts.
*   **Browse Twitter/X:** The extension will automatically start analyzing tweets and applying overlays as you scroll.
*   **Reveal Tweets:** Click the "Show Tweet Anyway" button on any overlay to see the original tweet.

## 📄 License

[MIT License](LICENSE) <!-- Optional: Add a LICENSE file if desired -->

---

Enjoy a cleaner timeline! 