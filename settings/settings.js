// Magic Pen Settings Script

class SettingsController {
    constructor() {
        this.defaults = {
            defaultTool: 'pen',
            defaultColor: '#FF0000',
            defaultSize: 4,
            confirmClear: true,
            showStatus: true
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['epicPenSettings', 'epicPenState']);
            const settings = result.epicPenSettings || {};
            const state = result.epicPenState || {};

            // Set form values
            document.getElementById('default-tool').value = state.currentTool || this.defaults.defaultTool;
            document.getElementById('default-color').value = state.currentColor || this.defaults.defaultColor;
            document.getElementById('default-size').value = state.strokeSize || this.defaults.defaultSize;
            document.getElementById('size-display').textContent = state.strokeSize || this.defaults.defaultSize;
            document.getElementById('confirm-clear').checked = settings.confirmClear ?? this.defaults.confirmClear;
            document.getElementById('show-status').checked = settings.showStatus ?? this.defaults.showStatus;
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showToast('Error loading settings', true);
        }
    }

    setupEventListeners() {
        // Size slider
        const sizeSlider = document.getElementById('default-size');
        sizeSlider.addEventListener('input', (e) => {
            document.getElementById('size-display').textContent = e.target.value;
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => this.saveSettings());

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSettings());
    }

    async saveSettings() {
        try {
            const settings = {
                confirmClear: document.getElementById('confirm-clear').checked,
                showStatus: document.getElementById('show-status').checked
            };

            const state = {
                currentTool: document.getElementById('default-tool').value,
                currentColor: document.getElementById('default-color').value,
                strokeSize: parseInt(document.getElementById('default-size').value),
                isEnabled: false
            };

            await chrome.storage.local.set({
                epicPenSettings: settings,
                epicPenState: state
            });

            this.showToast('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings', true);
        }
    }

    async resetSettings() {
        try {
            // Reset form to defaults
            document.getElementById('default-tool').value = this.defaults.defaultTool;
            document.getElementById('default-color').value = this.defaults.defaultColor;
            document.getElementById('default-size').value = this.defaults.defaultSize;
            document.getElementById('size-display').textContent = this.defaults.defaultSize;
            document.getElementById('confirm-clear').checked = this.defaults.confirmClear;
            document.getElementById('show-status').checked = this.defaults.showStatus;

            // Save defaults
            await this.saveSettings();
            this.showToast('Settings reset to defaults');
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showToast('Error resetting settings', true);
        }
    }

    showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.toggle('error', isError);
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }
}

// Initialize settings controller
document.addEventListener('DOMContentLoaded', () => {
    new SettingsController();
});
