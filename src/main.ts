// Audio output disabled - Player no longer needed
// import { Player } from "./player.ts";
import { Recorder } from "./recorder.ts";
import { AssistantService } from "./assistants.ts";
import "./style.css";
import { LowLevelRTClient, ResponseItem, SessionUpdateMessage } from "rt-client";

let endpoint = import.meta.env.VITE_AOAI_ENDPOINT;
let apiKey = import.meta.env.VITE_AOAI_API_KEY;
let deployment = import.meta.env.VITE_AOAI_DEPLOYMENT;
let realtimeStreaming: LowLevelRTClient;
let audioRecorder: Recorder;
// Audio output disabled - audioPlayer no longer needed
// let audioPlayer: Player;
let assistantService = new AssistantService();

// Clear customer information from localStorage on application start
localStorage.removeItem('customerInfo');
localStorage.removeItem('customerInfoId');
localStorage.setItem('customerInfoClear', 'true');

// Function to send customer information to the customer window
function sendCustomerInfo(content: string) {
  const messageId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('customerInfo', content);
  localStorage.setItem('customerInfoId', messageId);
  console.log('Sent customer info to localStorage:', content, 'with ID:', messageId);
}

// Function to clear customer information
function clearCustomerInfo() {
  localStorage.removeItem('customerInfo');
  localStorage.removeItem('customerInfoId');
  localStorage.setItem('customerInfoClear', 'true');
  console.log('Customer information cleared and clear flag set');
}

async function start_realtime(endpoint: string, apiKey: string, deploymentOrModel: string) {
  if (isAzureOpenAI()) {
    realtimeStreaming = new LowLevelRTClient(new URL(endpoint), { key: apiKey }, { deployment: deploymentOrModel });
  } else {
    realtimeStreaming = new LowLevelRTClient({ key: apiKey }, { model: deploymentOrModel });
  }

  try {
    let configMessage: SessionUpdateMessage = {
      type: "session.update",
      session: {
        turn_detection: {
          type: "server_vad",
        },
        input_audio_transcription: {
          model: "whisper-1"
        }
      }
    };
    assistantService.language = formLanguageField.value;
    let assistant: [systemMessage: string, tools: any[]] = assistantService.createGenericAssistantConfigMessage();
    configMessage.session.instructions = assistant[0];
    formAssistantField.value = "Generic Assistant";
    configMessage.session.tools = assistant[1];
    configMessage.session.voice = getVoice();
    configMessage.session.temperature = getTemperature();
    await realtimeStreaming.send(configMessage);
  } catch (error) {
    console.log(error);
    makeNewTextBlock("[Connection error]: Unable to send initial set_inference_config message. Please check your endpoint and authentication details.");
    setFormInputState(InputState.ReadyToStart);
    return;
  }
  await Promise.all([resetAudio(!formChatOnlyToggle.checked), handleRealtimeMessages()]);
}

let assistantMessage: string = "";

async function handleRealtimeMessages() {
  for await (const message of realtimeStreaming.messages()) {
    //console.log(message.type);

    switch (message.type) {      case "session.created":
        console.log(JSON.stringify(message, null, 2));
        setFormInputState(InputState.ReadyToStop);
        makeNewTextBlock("<< Session Started >>");        // Clear customer information and send session started message
        clearCustomerInfo();
        sendCustomerInfo("Welcome!");
        makeNewTextBlock();
        break;
      case "conversation.item.created":
        if (message.item.type == "message" && message.item.role == "user" && message.item.content[0].type == "input_text") {
          appendMessageId(message.item.id!);
        }
        break;
      case "response.content_part.added":
        makeNewTextBlock();
        appendToTextBlock("Assisatnt: ");
        // Reset assistant message for new response
        assistantMessage = "";
        break;
      case "response.text.delta":
        appendToTextBlock(message.delta);
        assistantMessage += message.delta;
        formReceivedTextContainer.scrollTo(0, formReceivedTextContainer.scrollHeight);
        break;
      case "response.audio_transcript.delta":
        appendToTextBlock(message.delta);
        assistantMessage += message.delta;
        formReceivedTextContainer.scrollTo(0, formReceivedTextContainer.scrollHeight);
        break;      case "response.audio.delta":
        // Audio output disabled - only processing text transcripts
        // const binary = atob(message.delta);
        // const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        // const pcmData = new Int16Array(bytes.buffer);
        // audioPlayer.play(pcmData);
        break;
      case "input_audio_buffer.speech_started":
        makeNewTextBlock("");
        let textElements = formReceivedTextContainer.children;
        latestInputSpeechBlock = textElements[textElements.length - 1];        makeNewTextBlock();
        // Audio output disabled - no need to clear audio player
        // audioPlayer.clear();
        break;
      case "conversation.item.input_audio_transcription.completed":
        latestInputSpeechBlock.textContent += 
        `User (Speech): ${message.transcript.replace(/[\n\r]+/g, '')} >> ${message.item_id!}`;
        latestInputSpeechBlock.id = message.item_id!;
        break;
      case "response.done":
        message.response.output.forEach(async (output: ResponseItem) => {
          if (output.type == 'function_call') {
            console.log(JSON.stringify(output, null, 2));
            let response = await assistantService.getToolResponse(output.name, output.arguments, output.call_id);
            console.log(JSON.stringify(response, null, 2));
            if (response.type == 'session.update') {
              response.session.voice = getVoice();
              response.session.temperature = getTemperature();
              formAssistantField.value = output.name;
            }
            realtimeStreaming.send(
              response
            );
            realtimeStreaming.send(
              {
                type: 'response.create'
              });
          }          else if (output.type == 'message') {
            appendMessageId(output.id!);
            // Parse the complete assistant message for tagged content
            console.log("Full assistant message:", assistantMessage);
            parseAndDisplayTaggedContent(assistantMessage);
            assistantMessage = "";
            formReceivedTextContainer.appendChild(document.createElement("hr"));
          }
        });

        break;
      case "error":
        console.log(JSON.stringify(message, null, 2));
        break;
      default:
        break
    }
  }
  resetAudio(false);
}

/**
 * Basic audio handling
 */

let recordingActive: boolean = false;

// function processAudioRecordingBuffer(buffer: Buffer) {
//   const uint8Array = new Uint8Array(buffer);
//   const regularArray = String.fromCharCode(...uint8Array);
//   const base64 = btoa(regularArray);
//   if (recordingActive) {
//     realtimeStreaming.send({
//       event: "add_user_audio",
//       data: base64,
//     });
//   }
// }
function processAudioRecordingBuffer(base64: string) {
  if (recordingActive) {
    realtimeStreaming.send({
      type: "input_audio_buffer.append",
      audio: base64,
    });
  }
}

async function resetAudio(startRecording: boolean) {
  recordingActive = false;
  if (audioRecorder) {
    audioRecorder.stop();
  }
  // Audio output disabled - no need to initialize or clear audio player
  // if (audioPlayer) {
  //   audioPlayer.clear();
  // }
  audioRecorder = new Recorder(processAudioRecordingBuffer);
  // audioPlayer = new Player();
  // audioPlayer.init(24000);
  if (startRecording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorder.start(stream);
    recordingActive = true;
  }
}

/**
 * UI and controls
 */

const formReceivedTextContainer = document.querySelector<HTMLDivElement>("#received-text-container")!;
const formAdviceTextContainer = document.querySelector<HTMLDivElement>("#advice-text-container")!;
const formStartButton = document.querySelector<HTMLButtonElement>("#start-recording")!;
const formStopButton = document.querySelector<HTMLButtonElement>("#stop-recording")!;
const formOpenCustomerWindowButton = document.querySelector<HTMLButtonElement>("#open-customer-window")!;
const formAssistantField = document.querySelector<HTMLInputElement>("#assistant")!;
const formTemperatureField = document.querySelector<HTMLInputElement>("#temperature")!;
const formVoiceSelection = document.querySelector<HTMLInputElement>("#voice")!;
const formLanguageField = document.querySelector<HTMLInputElement>("#language")!;
const formAzureToggle = document.querySelector<HTMLInputElement>("#azure-toggle")!;
const formChatOnlyToggle = document.querySelector<HTMLInputElement>("#chat-only")!;
const chatField = document.querySelector<HTMLTextAreaElement>("#chat")!;
const sendTextButton = document.querySelector<HTMLButtonElement>("#send-text")!;
const deleteItemId = document.querySelector<HTMLButtonElement>("#delete-item-id")!;
const deleteItemButton = document.querySelector<HTMLButtonElement>("#delete-item")!;

let latestInputSpeechBlock: Element;

enum InputState {
  Working,
  ReadyToStart,
  ReadyToStop,
}

function isAzureOpenAI(): boolean {
  return formAzureToggle.checked;
}

function setFormInputState(state: InputState) {
  formStartButton.disabled = state != InputState.ReadyToStart;
  formStopButton.disabled = state != InputState.ReadyToStop;
  formLanguageField.disabled = state != InputState.ReadyToStart;
  formAssistantField.disabled = state != InputState.ReadyToStart;
  formAzureToggle.disabled = state != InputState.ReadyToStart;
  formChatOnlyToggle.disabled = state != InputState.ReadyToStart;
  chatField.disabled = state != InputState.ReadyToStop;
  sendTextButton.disabled = state != InputState.ReadyToStop;
  deleteItemButton.disabled = state != InputState.ReadyToStop;
}

function getTemperature(): number {
  return parseFloat(formTemperatureField.value);
}

function getVoice(): "alloy" | "echo" | "shimmer" {
  return formVoiceSelection.value as "alloy" | "echo" | "shimmer";
}

function makeNewTextBlock(text: string = "") {
  let newElement = document.createElement("p");
  newElement.textContent = text;
  formReceivedTextContainer.appendChild(newElement);
}

function makeNewTextBlockInPane(container: HTMLDivElement, text: string = ""): HTMLElement {
  let newElement = document.createElement("div");
  
  // Check if the text contains a markdown table
  if (containsMarkdownTable(text)) {
    newElement.innerHTML = convertMarkdownTableToHTML(text);
  } else {
    // For regular text, create a paragraph element
    const p = document.createElement("p");
    p.textContent = text;
    newElement.appendChild(p);
  }
  
  container.appendChild(newElement);
  return newElement;
}

function containsMarkdownTable(text: string): boolean {
  // Check if text contains markdown table pattern
  // Look for lines with | characters and at least one header separator line
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

function convertMarkdownTableToHTML(text: string): string {
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
          html += `<th>${formatCellContent(cell)}</th>`;
        });
        html += '</tr>';
        headerProcessed = true;
      } else {
        // Regular data row
        html += '<tr>';
        cells.forEach(cell => {
          html += `<td>${formatCellContent(cell)}</td>`;
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

function formatCellContent(cell: string): string {
  // Handle line breaks in cells (convert <br> tags)
  let formatted = cell.replace(/<br>/g, '<br>');
  
  // Handle bold text (**text**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle bullet points (• character)
  formatted = formatted.replace(/•/g, '&bull;');
  
  return formatted;
}

function parseAndDisplayTaggedContent(text: string) {
  // Check for tagged content and extract it
  // Handle patterns with multiple tags in one message  // Use Unicode-aware regex to handle multi-byte characters like Japanese
  // Updated to handle both ## and ### tag endings to accommodate AI inconsistencies
  
  console.log("Parsing text for tagged content:", text);
  // If the text is empty or doesn't contain any tags, skip processing
  // Check for both correct (###) and incorrect (##) tag endings
  if (!text || (!text.includes("###AdviceToRepresentative###") && 
                 !text.includes("###AdviceToRepresentative##") &&
                 !text.includes("###InfoToRepresentative###") && 
                 !text.includes("###InfoToRepresentative##") &&
                 !text.includes("###InfoToCustomer###") &&
                 !text.includes("###InfoToCustomer##"))) {
    console.log("No tagged content found in message");
    return;
  }
  // Find all AdviceToRepresentative segments (handles both ## and ### endings)
  const adviceMatches = text.matchAll(/###AdviceToRepresentative###+?\s*([^#]*?)(?=\s*###|(?=\s*>>\s*item_)|$)/gu);
  for (const match of adviceMatches) {
    const content = match[1].trim();
    if (content) {
      console.log("Found AdviceToRepresentative:", content);
      // Create a unique identifier for this content to prevent duplicates
      const contentHash = `AdviceToRepresentative_${content.substring(0, 50)}`;      const existingElements = Array.from(formAdviceTextContainer.children);
      const isDuplicate = existingElements.some(el => {
        const elementText = el.textContent || "";
        return elementText.includes(content);
      });if (!isDuplicate) {
        const newElement = makeNewTextBlockInPane(formAdviceTextContainer, content);
        // Store the content hash as a data attribute for better duplicate detection
        if (newElement) {
          newElement.setAttribute('data-content-hash', contentHash);
        }
        formAdviceTextContainer.scrollTo(0, formAdviceTextContainer.scrollHeight);
      } else {
        console.log("Duplicate AdviceToRepresentative content detected, skipping");
      }
    }
  }
  // Find all InfoToRepresentative segments and add them to Advice to Representative pane (handles both ## and ### endings)
  const infoRepMatches = text.matchAll(/###InfoToRepresentative###+?\s*([^#]*?)(?=\s*###|(?=\s*>>\s*item_)|$)/gu);
  for (const match of infoRepMatches) {
    const content = match[1].trim();
    if (content) {
      console.log("Found InfoToRepresentative:", content);
      // Create a unique identifier for this content to prevent duplicates
      const contentHash = `InfoToRepresentative_${content.substring(0, 50)}`;      const existingElements = Array.from(formAdviceTextContainer.children);
      const isDuplicate = existingElements.some(el => {
        const elementText = el.textContent || "";
        return elementText.includes(content);
      });if (!isDuplicate) {
        const newElement = makeNewTextBlockInPane(formAdviceTextContainer, content);
        // Store the content hash as a data attribute for better duplicate detection
        if (newElement) {
          newElement.setAttribute('data-content-hash', contentHash);
        }
        formAdviceTextContainer.scrollTo(0, formAdviceTextContainer.scrollHeight);
      } else {
        console.log("Duplicate InfoToRepresentative content detected, skipping");
      }
    }
  }  // Find all InfoToCustomer segments (handles both ## and ### endings)
  const infoMatches = text.matchAll(/###InfoToCustomer###+?\s*([^#]*?)(?=\s*###|(?=\s*>>\s*item_)|$)/gu);
  for (const match of infoMatches) {
    const content = match[1].trim();
    if (content) {      console.log("Found InfoToCustomer:", content);
      // Send customer info to the customer window via localStorage
      sendCustomerInfo(content);
    }
  }
}

function appendMessageId(id: string) {
  let textElements = formReceivedTextContainer.children;
  textElements[textElements.length - 1].id = id;
  textElements[textElements.length - 1].textContent += ` >> ${id}`;
}

function markTextAsDeleted(id: string) {
  let textElements = document.getElementById(id);
  textElements?.classList.add("strike");
}

function appendToTextBlock(text: string) {
  let textElements = formReceivedTextContainer.children;
  if (textElements.length == 0) {
    makeNewTextBlock();
  }
  textElements[textElements.length - 1].textContent += text;
}

formStartButton.addEventListener("click", async () => {
  setFormInputState(InputState.Working);

  try {
    start_realtime(endpoint, apiKey, deployment);
  } catch (error) {
    console.log(error);
    setFormInputState(InputState.ReadyToStart);
  }
});

formStopButton.addEventListener("click", async () => {
  setFormInputState(InputState.Working);
  resetAudio(false);
  realtimeStreaming.close();
  setFormInputState(InputState.ReadyToStart);
});

sendTextButton.addEventListener('click', async () => {
  let input = chatField.value.trim();
  realtimeStreaming.send(
    {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: input
        }]
      }
    }
  );
  // Audio output disabled - no need to clear audio player
  // audioPlayer.clear();
  appendToTextBlock(`User: ${input}`);
  chatField.value = '';
});

chatField.addEventListener('keypress', async (e) => {
  if (e.key !== 'Enter') {
    return;
  }

  e.preventDefault();

  let input = chatField.value.trim();
  realtimeStreaming.send(
    {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: input
        }]
      }
    }
  );  realtimeStreaming.send(
    {
      type: 'response.create'
    }
  );
  // Audio output disabled - no need to clear audio player
  // audioPlayer.clear();
  appendToTextBlock(`User: ${input}`);
  chatField.value = '';
});

deleteItemButton.addEventListener('click', async () => {
  let id = deleteItemId.value.trim();
  if (id != "") {
    realtimeStreaming.send(
      {
        type: 'conversation.item.delete',
        item_id: id
      }
    );
    deleteItemId.value = '';
    markTextAsDeleted(id);  }
});

// Add pane resizing functionality
function initializePaneResizing() {
  const resizers = document.querySelectorAll('.pane-resize');
  
  resizers.forEach((resizer, index) => {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let nextStartWidth = 0;
    
    resizer.addEventListener('mousedown', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      isResizing = true;
      startX = mouseEvent.clientX;
      
      // Find the elements before and after the resizer
      let currentPane = resizer.previousElementSibling as HTMLElement;
      let nextPane: HTMLElement | null = null;
        // Handle the special case of the right resizer for "Advice to Representative"
      if (index === 1) { // Second resizer (right side of Advice pane)
        // The next pane is the settings pane (controls pane-group)
        nextPane = document.querySelector('.controls.pane-group') as HTMLElement;
      } else {
        nextPane = resizer.nextElementSibling as HTMLElement;
      }
      
      if (!currentPane || !nextPane) return;
      
      startWidth = parseInt(window.getComputedStyle(currentPane).width, 10);
      nextStartWidth = parseInt(window.getComputedStyle(nextPane).width, 10);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      e.preventDefault();
        function handleMouseMove(e: MouseEvent) {
        if (!isResizing || !nextPane) return;
        
        const diffX = e.clientX - startX;
        const newWidth = startWidth + diffX;
        const newNextWidth = nextStartWidth - diffX;
        
        // Minimum width constraints
        const minWidth = nextPane.classList.contains('controls') ? 250 : 150;
        
        if (newWidth > 150 && newNextWidth > minWidth) {
          currentPane.style.width = newWidth + 'px';
          nextPane.style.width = newNextWidth + 'px';
          currentPane.style.flex = 'none';
          nextPane.style.flex = 'none';
        }
      }
      
      function handleMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    });
  });
}

// Initialize pane resizing when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initializePaneResizing();
});

// Clear customer information when the main window is being unloaded
window.addEventListener('beforeunload', () => {
  clearCustomerInfo();
});

formOpenCustomerWindowButton.addEventListener("click", () => {
  // Open the customer window on the same port but different HTML file
  const customerWindowUrl = `${window.location.origin}/customer.html`;
  const customerWindow = window.open(
    customerWindowUrl,
    'customerWindow',
    'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
  );
  
  if (!customerWindow) {
    alert('Please allow pop-ups for this site to open the customer window.\n\nAlternatively, you can manually open: ' + customerWindowUrl);
  }
});