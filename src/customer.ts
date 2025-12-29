import "./customer-style.css";

// Customer window functionality
class CustomerWindow {
  private customerInfoContainer: HTMLDivElement;
  private connectionStatus: HTMLElement;
  private statusIndicator: HTMLElement;
  private statusText: HTMLElement;
  private pollingInterval: number | null = null;
  private lastMessageId: string = '';

  constructor() {
    this.customerInfoContainer = document.querySelector<HTMLDivElement>("#customer-info-container")!;
    this.connectionStatus = document.querySelector<HTMLElement>("#connection-status")!;
    this.statusIndicator = this.connectionStatus.querySelector<HTMLElement>(".status-indicator")!;
    this.statusText = this.connectionStatus.querySelector<HTMLElement>(".status-text")!;
    
    // Clear any existing content from previous sessions
    this.clearCustomerInfo();
    
    this.initializeLocalStoragePolling();
    this.setupEventListeners();
    this.updateConnectionStatus('online', 'Connected');
  }
  private initializeLocalStoragePolling() {
    // Poll localStorage for customer info updates
    this.pollingInterval = window.setInterval(() => {      // Check for clear command first
      const clearFlag = localStorage.getItem('customerInfoClear');
      if (clearFlag === 'true') {
        console.log('Clear flag detected, clearing customer info');
        this.clearCustomerInfo();
        localStorage.removeItem('customerInfoClear');
        return;
      }
      
      const customerInfo = localStorage.getItem('customerInfo');
      const messageId = localStorage.getItem('customerInfoId');
        if (customerInfo && messageId && messageId !== this.lastMessageId) {
        console.log('New customer info received:', customerInfo, 'with ID:', messageId);
        this.lastMessageId = messageId;
        this.displayCustomerInfo(customerInfo);
      }
    }, 200); // Poll every 200ms for more responsive updates
  }

  private updateConnectionStatus(status: 'online' | 'offline', text: string) {
    this.statusIndicator.className = `status-indicator ${status}`;
    this.statusText.textContent = text;
  }
  private displayCustomerInfo(content: string) {
    console.log('Displaying customer info:', content);
    
    // Create a new element for the customer information
    const newElement = document.createElement("div");
    
    // Check if the content contains markdown table format
    if (this.containsMarkdownTable(content)) {
      newElement.innerHTML = this.convertMarkdownTableToHTML(content);
    } else {
      const p = document.createElement("p");
      p.textContent = content;
      newElement.appendChild(p);
    }
    
    this.customerInfoContainer.appendChild(newElement);
    
    // Scroll to the latest content
    this.customerInfoContainer.scrollTo(0, this.customerInfoContainer.scrollHeight);
    
    // Remove welcome message if it exists
    const welcomeMessage = this.customerInfoContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
  }

  private containsMarkdownTable(text: string): boolean {
    // Check if text contains markdown table pattern
    const lines = text.split('\n');
    let hasHeaderSeparator = false;
    let hasPipeLines = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('|')) {
        hasPipeLines++;
        // Check for header separator (contains --- or similar)
        if (trimmedLine.match(/^\|[\s\-|]+\|$/)) {
          hasHeaderSeparator = true;
        }
      }
    }
    
    return hasPipeLines >= 2 && hasHeaderSeparator;
  }
  private convertMarkdownTableToHTML(text: string): string {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let html = '';
    let inTable = false;
    let headerProcessed = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('|')) {
        // Check if this is a header separator line
        if (line.match(/^\|[\s\-|]+\|$/)) {
          continue; // Skip header separator line
        }
        
        if (!inTable) {
          html += '<table class="markdown-table"><tbody>';
          inTable = true;
        }
        
        // Parse table row
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        
        if (!headerProcessed) {
          // First data row - treat as header
          html += '<tr>';
          cells.forEach(cell => {
            html += `<th>${this.formatCellContent(cell)}</th>`;
          });
          html += '</tr>';
          headerProcessed = true;
        } else {
          // Regular data row
          html += '<tr>';
          cells.forEach(cell => {
            html += `<td>${this.formatCellContent(cell)}</td>`;
          });
          html += '</tr>';
        }
      } else {
        // Non-table content
        if (inTable) {
          html += '</tbody></table>';
          inTable = false;
        }
        if (line.length > 0) {
          html += `<p>${line}</p>`;
        }
      }
    }
    
    if (inTable) {
      html += '</tbody></table>';
    }
    
    return html;
  }

  private formatCellContent(cell: string): string {
    // Handle line breaks in cells (convert <br> tags)
    let formatted = cell.replace(/<br>/g, '<br>');
    
    // Handle bold text (**text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle bullet points (• character)
    formatted = formatted.replace(/•/g, '&bull;');
    
    return formatted;
  }
  private clearCustomerInfo() {
    this.customerInfoContainer.innerHTML = '<p class="welcome-message">Welcome!</p>';
    this.lastMessageId = '';
    console.log('Customer information cleared');
  }

  private setupEventListeners() {
    // Handle window closing
    window.addEventListener('beforeunload', () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.pollingInterval) {
        this.initializeLocalStoragePolling();
      } else if (document.visibilityState === 'hidden' && this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    });

    // Listen for clear command
    window.addEventListener('storage', (e) => {
      if (e.key === 'customerInfoClear' && e.newValue === 'true') {
        this.clearCustomerInfo();
        localStorage.removeItem('customerInfoClear');
      }
    });
  }
}

// Initialize the customer window when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CustomerWindow();
});
