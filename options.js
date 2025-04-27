document.addEventListener('DOMContentLoaded', function() {
  const promptsList = document.getElementById('prompts-list');
  const newPromptInput = document.getElementById('new-prompt-input');
  const addPromptButton = document.getElementById('add-prompt-button');
  let currentPrompts = [];

  // API Key elements
  const apiKeyInput = document.getElementById('api-key-input');
  const saveApiKeyButton = document.getElementById('save-api-key-button');
  const apiKeyStatus = document.getElementById('api-key-status');

  // --- Storage Keys ---
  const PROMPTS_STORAGE_KEY = 'cleanTwitterExclusionPrompts';
  const API_KEY_STORAGE_KEY = 'cleanTwitterApiKey';

  // --- Default Prompts (used if none in storage) ---
  const DEFAULT_PROMPTS = [
    "Is the following tweet related to politics, government actions, geopolitical conflicts, elections, or activism?"
  ];

  const noPromptsMessage = document.querySelector('.no-prompts-message');

  // --- Load API Key from storage ---
  function loadApiKey() {
      chrome.storage.sync.get([API_KEY_STORAGE_KEY], function(result) {
          apiKeyStatus.textContent = ''; // Clear previous status
          apiKeyStatus.className = 'status-message'; // Reset class
          if (chrome.runtime.lastError) {
              console.error("Error loading API key:", chrome.runtime.lastError);
              apiKeyStatus.textContent = 'Error loading key.';
              apiKeyStatus.classList.add('error');
              return;
          }
          const storedKey = result[API_KEY_STORAGE_KEY];
          if (storedKey) {
              apiKeyInput.value = storedKey; // Don't show placeholder if key exists
              apiKeyStatus.textContent = 'API Key is currently saved.';
              apiKeyStatus.classList.add('info');
          } else {
              apiKeyInput.placeholder = 'Enter your key (sk-...)'; // Reset placeholder if needed
              apiKeyStatus.textContent = 'No API Key saved.';
              apiKeyStatus.classList.add('info');
          }
      });
  }

  // --- Save API Key to storage ---
  function saveApiKey() {
      const apiKey = apiKeyInput.value.trim();
      apiKeyStatus.textContent = ''; // Clear previous status
      apiKeyStatus.className = 'status-message'; // Reset class

      if (apiKey && apiKey.startsWith('sk-')) { // Basic validation
          chrome.storage.sync.set({ [API_KEY_STORAGE_KEY]: apiKey }, function() {
              if (chrome.runtime.lastError) {
                  console.error("Error saving API key:", chrome.runtime.lastError);
                  apiKeyStatus.textContent = 'Error saving key.';
                  apiKeyStatus.classList.add('error');
              } else {
                  console.log("API key saved successfully.");
                  apiKeyStatus.textContent = 'API Key saved successfully!';
                  apiKeyStatus.classList.add('success');
                  // Optionally clear success message after a delay
                  setTimeout(() => {
                      if (apiKeyStatus.classList.contains('success')) { // Check if still success msg
                          apiKeyStatus.textContent = 'API Key is currently saved.';
                          apiKeyStatus.className = 'status-message info';
                      }
                  }, 3000);
              }
          });
      } else if (apiKey) {
          apiKeyStatus.textContent = 'Invalid API Key format (must start with sk-).';
          apiKeyStatus.classList.add('error');
      } else {
          // Clear the stored key if the input is empty
          chrome.storage.sync.remove(API_KEY_STORAGE_KEY, () => {
              if(chrome.runtime.lastError) {
                  console.error("Error clearing API key:", chrome.runtime.lastError);
                  apiKeyStatus.textContent = 'Error clearing key.';
                  apiKeyStatus.classList.add('error');
              } else {
                  console.log("API key cleared.");
                  apiKeyStatus.textContent = 'API Key cleared.';
                  apiKeyStatus.classList.add('info');
              }
          });
      }
  }

  // --- Load prompts from storage --- 
  function loadPrompts() {
    chrome.storage.sync.get([PROMPTS_STORAGE_KEY], function(result) {
      currentPrompts = result[PROMPTS_STORAGE_KEY];
      // If no prompts in storage or it's not an array, use defaults
      if (!Array.isArray(currentPrompts)) {
        console.log("No prompts found in storage or invalid format, using defaults.");
        currentPrompts = [...DEFAULT_PROMPTS]; // Use a copy
        // Save defaults to storage immediately
        savePrompts();
      }
      renderPrompts();
    });
  }

  // --- Save prompts to storage ---
  function savePrompts() {
    chrome.storage.sync.set({ [PROMPTS_STORAGE_KEY]: currentPrompts }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error saving prompts:", chrome.runtime.lastError);
      } else {
        console.log("Prompts saved successfully.");
      }
    });
  }

  // --- Render the list of prompts in the UI ---
  function renderPrompts() {
    promptsList.innerHTML = ''; // Clear existing list
    
    if (currentPrompts.length === 0) {
        noPromptsMessage.style.display = 'block'; // Show the message
    } else {
        noPromptsMessage.style.display = 'none'; // Hide the message
        currentPrompts.forEach((prompt, index) => {
          const listItem = document.createElement('li');
          const textSpan = document.createElement('span');
          textSpan.textContent = prompt;
          
          const removeButton = document.createElement('button');
          removeButton.textContent = 'Remove';
          removeButton.classList.add('button', 'button-danger'); // Use new button classes
          removeButton.dataset.index = index; // Store index for removal

          removeButton.addEventListener('click', function() {
            removePrompt(parseInt(this.dataset.index));
          });

          listItem.appendChild(textSpan);
          listItem.appendChild(removeButton);
          promptsList.appendChild(listItem);
        });
    }
  }

  // --- Add a new prompt --- 
  function addPrompt() {
    const newPrompt = newPromptInput.value.trim();
    if (newPrompt && !currentPrompts.includes(newPrompt)) { // Prevent duplicates and empty prompts
      currentPrompts.push(newPrompt);
      newPromptInput.value = ''; // Clear input field
      savePrompts();
      renderPrompts(); // Re-render the list
    } else if (currentPrompts.includes(newPrompt)){
        alert("This prompt already exists.");
    } else {
        alert("Prompt cannot be empty.");
    }
  }

  // --- Remove a prompt by index ---
  function removePrompt(index) {
    if (index >= 0 && index < currentPrompts.length) {
      currentPrompts.splice(index, 1);
      savePrompts();
      renderPrompts(); // Re-render the list
    }
  }

  // --- Event Listeners ---
  // API Key
  saveApiKeyButton.addEventListener('click', saveApiKey);
  apiKeyInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
          saveApiKey();
      }
  });

  // Prompts
  addPromptButton.addEventListener('click', addPrompt);
  newPromptInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
          addPrompt();
      }
  });

  // --- Initial Load ---
  loadApiKey();
  loadPrompts();
}); 