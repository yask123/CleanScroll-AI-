console.log("Clean Twitter extension loaded.");

// Function to extract text from a tweet element
function getTweetText(tweetElement) {
  // Try to find the text using data-testid="tweetText"
  const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
  if (textElement) {
    // .textContent might include hidden elements, attempt to get visible text
    // This is a basic attempt, might need refinement based on actual structure
    let visibleText = '';
    textElement.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        visibleText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'A') { // Exclude links for now
        visibleText += node.textContent;
      }
    });
    return visibleText.trim();
  }
  console.warn("Could not find text element for tweet:", tweetElement);
  return null; // Return null if text can't be found
}

// Function to remove existing overlay from a tweet
function removeOverlay(tweetElement) {
  const existingOverlay = tweetElement.querySelector('.clean-twitter-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
    tweetElement.style.position = ''; // Reset position if needed
    console.log("Content: Removed existing overlay.");
  }
  // Clear the revealed flag if we are explicitly removing overlay (e.g., tweet is now considered safe)
  delete tweetElement.dataset.cleanTwitterRevealed;
}

// Function to add overlay to a tweet
function addOverlay(tweetElement) {
  // Check if already revealed by user or already has an overlay
  if (tweetElement.dataset.cleanTwitterRevealed === 'true' || tweetElement.querySelector('.clean-twitter-overlay')) {
    console.log("Content: Skipping overlay add (already revealed or overlay exists).");
    return;
  }

  console.log("Content: Adding exclusion overlay.");
  tweetElement.style.position = 'relative'; // Ensure parent is positioned

  const overlay = document.createElement('div');
  overlay.classList.add('clean-twitter-overlay');

  const message = document.createElement('p');
  message.textContent = 'This tweet was hidden by Clean Twitter as it matched one of your exclusion criteria.';

  const revealButton = document.createElement('button');
  revealButton.classList.add('clean-twitter-reveal-button');
  revealButton.textContent = 'Show Tweet Anyway';

  revealButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent click from bubbling up
    console.log("Content: Reveal button clicked.");
    tweetElement.dataset.cleanTwitterRevealed = 'true'; // Mark as revealed
    overlay.remove(); // Remove the overlay itself
    tweetElement.style.position = ''; // Reset position if needed
    // No need to remove border here, as it wasn't applied in the first place
  });

  overlay.appendChild(message);
  overlay.appendChild(revealButton);
  tweetElement.appendChild(overlay);
  tweetElement.dataset.classification = 'excluded-covered';
}

// Function to process tweets currently on the page
function processTweets() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach(tweet => {
    // Skip if already processed AND revealed by the user
    if (tweet.dataset.processedByCleanTwitter && tweet.dataset.cleanTwitterRevealed === 'true') {
      // console.log("Content: Skipping already processed and revealed tweet.");
      return; 
    }
    
    // Check if we've already processed this tweet (but not revealed)
    if (!tweet.dataset.processedByCleanTwitter) {
      tweet.dataset.processedByCleanTwitter = 'true';
      console.log("Processing tweet:", tweet);

      const tweetText = getTweetText(tweet);

      if (tweetText) {
        console.log("Content: Sending tweet text to background:", tweetText);
        chrome.runtime.sendMessage(
          { action: "analyzeTweet", text: tweetText },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Content: Error sending message to background:", chrome.runtime.lastError);
              tweet.style.border = '1px solid red'; // Generic error border
              return;
            }
            // --- Response handling logic moved here ---
            if (response && typeof response.excluded !== 'undefined') {
              // --- Action based on combined analysis ---
              if (response.excluded) {
                  // Tweet matched exclusion criteria - Add Overlay
                  addOverlay(tweet);
              } else {
                  // Tweet did not match exclusion criteria - Remove Overlay
                  console.log("Content: Tweet classified as not excluded. Removing overlay if present.");
                  removeOverlay(tweet);
                  tweet.style.border = 'none'; // Ensure no leftover borders
                  tweet.dataset.classification = 'not-excluded';
              }
            } else if (response && response.error === "API Key Missing") {
                console.warn("Content: Background script reported API key missing. Cannot classify.");
                removeOverlay(tweet); // Remove overlay if present
                tweet.style.border = '1px solid orange'; // Orange border for API key error
                tweet.dataset.classification = 'error-api-key';
            } else {
              console.error("Content: Invalid response from background script:", response);
              removeOverlay(tweet); // Remove overlay if present
              tweet.style.border = '1px solid purple'; // Purple border for other errors
              tweet.dataset.classification = 'error-invalid-response';
            }
            // --- End Action ---
          }
        );
      } else {
        console.log("Content: Skipping analysis, could not extract text.");
        removeOverlay(tweet); // Clean up any potential overlay if text fails
        tweet.style.border = 'none';
      }
    }
    // If already processed but NOT revealed, it might need re-evaluation 
    // (e.g., if prompts changed). For now, we assume it stays hidden/overlayed 
    // until the page reloads or the tweet is removed/re-added by Twitter's UI.
  });
}

// Options for the observer (watch for additions to the DOM)
const config = { childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = function(mutationsList, observer) {
  // Look for new nodes added that might be tweets
  for(const mutation of mutationsList) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Process tweets potentially added in this mutation
      processTweets();
      // We could be more specific here and check if addedNodes contain tweets,
      // but processing all visible tweets is often simpler.
      break; // No need to check other mutations if we found added nodes
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
// We observe the body, but a more specific container could be more efficient if identified
observer.observe(document.body, config);

// Initial run to process tweets already on the page when the script loads
console.log("Clean Twitter: Initial processing run.");
processTweets();

console.log("Clean Twitter: MutationObserver is now active.");

// Future logic to hide elements will go here.
// Remember to disconnect the observer if the extension is unloaded or updated
// window.addEventListener('unload', () => observer.disconnect()); // Example cleanup 