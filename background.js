// --- OpenAI Config ---
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
let currentApiKey = null; // Will be loaded from storage

// --- Storage Keys ---
const PROMPTS_STORAGE_KEY = 'cleanTwitterExclusionPrompts';
const API_KEY_STORAGE_KEY = 'cleanTwitterApiKey';

// --- Default Prompts (used if none in storage) ---
const DEFAULT_PROMPTS = [
  "Is the following tweet related to politics, government actions, geopolitical conflicts, elections, or activism?"
];

// --- Current prompts (will be loaded from storage) ---
let currentExclusionPrompts = [...DEFAULT_PROMPTS]; // Initialize with defaults

// --- Function to load API Key from storage ---
function loadApiKeyFromStorage() {
    chrome.storage.sync.get([API_KEY_STORAGE_KEY], function(result) {
        if (chrome.runtime.lastError) {
            console.error("Background: Error loading API key:", chrome.runtime.lastError);
            currentApiKey = null;
            return;
        }
        const storedKey = result[API_KEY_STORAGE_KEY];
        if (storedKey && typeof storedKey === 'string' && storedKey.startsWith('sk-')) {
            currentApiKey = storedKey;
            console.log("Background: API Key loaded from storage.");
        } else {
            currentApiKey = null;
            console.log("Background: No valid API Key found in storage.");
            // Consider notifying the user somehow (e.g., badge text) if the key is missing/invalid
        }
    });
}

// Function to load prompts from storage
function loadPromptsFromStorage() {
  chrome.storage.sync.get([PROMPTS_STORAGE_KEY], function(result) {
    if (chrome.runtime.lastError) {
        console.error("Background: Error loading prompts from storage:", chrome.runtime.lastError);
        // Keep using the defaults/last known value if loading fails
        return;
    }
    const storedPrompts = result[PROMPTS_STORAGE_KEY];
    if (Array.isArray(storedPrompts) && storedPrompts.length > 0) {
      currentExclusionPrompts = storedPrompts;
      console.log("Background: Loaded prompts from storage:", currentExclusionPrompts);
    } else {
      // If nothing valid in storage, ensure defaults are used and maybe save them
      console.log("Background: No valid prompts in storage, using defaults.");
      currentExclusionPrompts = [...DEFAULT_PROMPTS];
      // Optionally save defaults if storage was empty/invalid
      chrome.storage.sync.set({ [PROMPTS_STORAGE_KEY]: currentExclusionPrompts });
    }
  });
}

// --- Listener for storage changes ---
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Check for API Key changes
    if (changes[API_KEY_STORAGE_KEY]) {
        const newApiKey = changes[API_KEY_STORAGE_KEY].newValue;
        if (newApiKey && typeof newApiKey === 'string' && newApiKey.startsWith('sk-')) {
            currentApiKey = newApiKey;
            console.log('Background: API Key updated from storage.');
        } else {
            currentApiKey = null;
            console.warn('Background: API Key removed or became invalid in storage.');
        }
    }
    // Check for Prompt changes
    if (changes[PROMPTS_STORAGE_KEY]) {
      const newPrompts = changes[PROMPTS_STORAGE_KEY].newValue;
      if (Array.isArray(newPrompts)) {
        currentExclusionPrompts = newPrompts;
        console.log('Background: Exclusion prompts updated from storage:', currentExclusionPrompts);
      } else {
        console.warn("Background: Invalid prompts received from storage update, keeping previous.");
      }
    }
  }
});

// --- Initial load when background script starts ---
loadApiKeyFromStorage(); // Load API Key first
loadPromptsFromStorage();

// Function to call OpenAI for a single prompt and tweet text
async function checkPrompt(tweetText, prompt) {
  if (!currentApiKey) {
      console.error("Background: OpenAI API Key is missing or invalid. Cannot analyze tweet.");
      // Maybe update badge text to indicate error?
      // chrome.action.setBadgeText({ text: 'KEY?' });
      // chrome.action.setBadgeBackgroundColor({ color: '#dc3545' }); // Red
      return false; // Cannot proceed without a key
  }
  // else {
  //   // Clear badge if key is present (optional)
  //   chrome.action.setBadgeText({ text: '' });
  // }

  const specificPrompt = `${prompt} Start your response with 'YES' or 'NO'.`;
  console.log(`Background: Checking prompt: "${specificPrompt}" for text: "${tweetText.substring(0, 50)}..."`);
  try {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentApiKey}` // Use the loaded key
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: specificPrompt },
          { role: "user", content: `Tweet: ${tweetText}` }
        ],
        max_tokens: 5
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`OpenAI API Error (${response.status}) for prompt "${prompt}":`, errData);
      // Potentially check for 401/403 Unauthorized specifically
      if (response.status === 401 || response.status === 403) {
          console.error("Background: OpenAI API Key seems invalid or unauthorized.");
          // Maybe update badge text?
          // chrome.action.setBadgeText({ text: 'KEY!' });
          // chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
          currentApiKey = null; // Assume key is bad
      }
      return false; // Treat API errors as non-match for safety
    }

    const data = await response.json();
    const analysisContent = data?.choices?.[0]?.message?.content;
    console.log(`Background: Response for prompt "${prompt}":`, analysisContent);
    return analysisContent && analysisContent.trim().toUpperCase().startsWith('YES');

  } catch (error) {
    console.error(`Background: Error fetching OpenAI for prompt "${prompt}":`, error);
    return false; // Treat fetch errors as non-match
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeTweet") {
    console.log("Background: Received tweet text:", request.text);

    // Use the dynamically loaded prompts
    const promptsToCheck = [...currentExclusionPrompts]; // Use a copy

    if (promptsToCheck.length === 0) {
        console.log("Background: No exclusion prompts configured. Skipping analysis.");
        sendResponse({ excluded: false });
        return false; // No async response needed
    }

    // Check if API key is present before proceeding
    if (!currentApiKey) {
        console.warn("Background: Cannot analyze tweet, API key missing.");
        sendResponse({ excluded: false, error: "API Key Missing" }); // Send back an error indication
        return false; // No async response needed
    }

    // Check all exclusion prompts concurrently
    Promise.all(promptsToCheck.map(prompt => checkPrompt(request.text, prompt)))
      .then(results => {
        // Check if *any* prompt returned true (YES)
        const isExcluded = results.some(result => result === true);
        console.log(`Background: Final exclusion decision (${promptsToCheck.length} prompts checked):`, isExcluded);
        sendResponse({ excluded: isExcluded });
      })
      .catch(error => {
        console.error("Background: Error processing prompts:", error);
        sendResponse({ excluded: false }); // Default to not excluding on error
      });

    // Return true to indicate you wish to send a response asynchronously
    return true;
  }
});

console.log("Clean Twitter Background Script Loaded and listening for storage changes."); 