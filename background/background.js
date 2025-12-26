// Magic Pen Background Service Worker
// Handles keyboard shortcuts and cross-tab communication

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
    const tab = await getCurrentTab();
    if (!tab?.id) return;

    switch (command) {
        case 'toggle-drawing':
            await toggleDrawingMode(tab.id);
            break;
        case 'select-pen':
            await sendToTab(tab.id, { action: 'setTool', tool: 'pen' });
            break;
        case 'select-highlighter':
            await sendToTab(tab.id, { action: 'setTool', tool: 'highlighter' });
            break;
        case 'select-eraser':
            await sendToTab(tab.id, { action: 'setTool', tool: 'eraser' });
            break;
        case 'undo-stroke':
            await sendToTab(tab.id, { action: 'undo' });
            break;
        case 'clear-all':
            await sendToTab(tab.id, { action: 'clear' });
            break;
    }
});

// Toggle drawing mode and update storage
async function toggleDrawingMode(tabId) {
    try {
        const result = await chrome.storage.local.get(['epicPenState']);
        const currentState = result.epicPenState || { isEnabled: false };
        const newEnabled = !currentState.isEnabled;

        // Update storage
        await chrome.storage.local.set({
            epicPenState: { ...currentState, isEnabled: newEnabled }
        });

        // Send to content script
        await sendToTab(tabId, { action: 'toggleDrawing', enabled: newEnabled });
    } catch (error) {
        console.error('Error toggling drawing mode:', error);
    }
}

// Get current active tab
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// Send message to content script
async function sendToTab(tabId, message) {
    try {
        await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
        // Content script might not be loaded yet
        console.log('Content script not ready:', error.message);
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.local.set({
            epicPenState: {
                isEnabled: false,
                currentTool: 'pen',
                currentColor: '#FF0000',
                strokeSize: 4
            },
            epicPenSettings: {
                showStatusIndicator: true,
                confirmClear: true
            }
        });

        // Open welcome/settings page
        chrome.runtime.openOptionsPage();
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getState') {
        chrome.storage.local.get(['epicPenState'], (result) => {
            sendResponse(result.epicPenState || {});
        });
        return true;
    }
});
