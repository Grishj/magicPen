// Magic Pen Popup Script

class PopupController {
  constructor() {
    this.state = {
      isEnabled: false,
      currentTool: 'pen',
      currentColor: '#FF0000',
      strokeSize: 4
    };

    this.init();
  }

  async init() {
    // Load saved state
    await this.loadState();

    // Setup event listeners
    this.setupEventListeners();

    // Update UI to match state
    this.updateUI();
  }

  async loadState() {
    try {
      const result = await chrome.storage.local.get(['epicPenState']);
      if (result.epicPenState) {
        this.state = { ...this.state, ...result.epicPenState };
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  async saveState() {
    try {
      await chrome.storage.local.set({ epicPenState: this.state });
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  setupEventListeners() {
    // Toggle drawing mode
    const toggleBtn = document.getElementById('toggle-drawing');
    toggleBtn.addEventListener('click', () => this.toggleDrawingMode());

    // Tool selection
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.selectTool(tool);
      });
    });

    // Color selection
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        this.selectColor(color);
      });
    });

    // Custom color picker
    const customColor = document.getElementById('custom-color');
    customColor.addEventListener('input', (e) => {
      this.selectColor(e.target.value);
    });

    // Stroke size slider
    const strokeSlider = document.getElementById('stroke-size');
    strokeSlider.addEventListener('input', (e) => {
      this.setStrokeSize(parseInt(e.target.value));
    });

    // Action buttons
    document.getElementById('undo-btn').addEventListener('click', () => this.sendAction('undo'));
    document.getElementById('redo-btn').addEventListener('click', () => this.sendAction('redo'));
    document.getElementById('clear-btn').addEventListener('click', () => this.sendAction('clear'));

    // Settings link
    document.getElementById('settings-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }

  updateUI() {
    // Update toggle button
    const toggleBtn = document.getElementById('toggle-drawing');
    const toggleText = document.getElementById('toggle-text');
    if (this.state.isEnabled) {
      toggleBtn.classList.add('active');
      toggleText.textContent = 'Enabled';
    } else {
      toggleBtn.classList.remove('active');
      toggleText.textContent = 'Enable';
    }

    // Update tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === this.state.currentTool);
    });

    // Update color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === this.state.currentColor);
    });

    // Update custom color picker
    document.getElementById('custom-color').value = this.state.currentColor;

    // Update stroke slider
    document.getElementById('stroke-size').value = this.state.strokeSize;
    document.getElementById('size-value').textContent = this.state.strokeSize;
  }

  async toggleDrawingMode() {
    this.state.isEnabled = !this.state.isEnabled;
    this.updateUI();
    await this.saveState();

    // Ensure content script is injected, then send message
    await this.ensureContentScriptAndSend({
      action: 'toggleDrawing',
      enabled: this.state.isEnabled
    });
  }

  async selectTool(tool) {
    this.state.currentTool = tool;
    this.updateUI();
    await this.saveState();
    await this.sendToContentScript({
      action: 'setTool',
      tool: tool
    });
  }

  async selectColor(color) {
    this.state.currentColor = color;
    this.updateUI();
    await this.saveState();
    await this.sendToContentScript({
      action: 'setColor',
      color: color
    });
  }

  async setStrokeSize(size) {
    this.state.strokeSize = size;
    document.getElementById('size-value').textContent = size;
    await this.saveState();
    await this.sendToContentScript({
      action: 'setStrokeSize',
      size: size
    });
  }

  async sendAction(actionType) {
    await this.sendToContentScript({
      action: actionType
    });
  }

  async ensureContentScriptAndSend(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      // Try to send message first
      try {
        await chrome.tabs.sendMessage(tab.id, message);
        return; // Success
      } catch (e) {
        // Content script not loaded, inject it
        console.log('Injecting content script...');
      }

      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/canvas.js']
      });

      // Also inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/content.css']
      });

      // Wait a moment for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now send the message
      await chrome.tabs.sendMessage(tab.id, message);

    } catch (error) {
      console.error('Error with content script:', error);
    }
  }

  async sendToContentScript(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (error) {
      console.error('Error sending message to content script:', error);
    }
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
