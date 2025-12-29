# Testing Customer Window Initialization

## Test Steps

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Open the main application:**
   - Navigate to `http://localhost:5173`

3. **Open the customer window:**
   - Click "Open Customer Window" button
   - OR manually navigate to `http://localhost:5173/customer.html`

4. **Test initialization:**
   - Customer window should show: "Welcome!"
   - No previous session data should be visible

5. **Test session start:**
   - In main application, click "Start" button
   - Customer window should clear any previous content and show: "Welcome!"

6. **Test restart behavior:**
   - Refresh the main application (F5)
   - Customer window should clear and show welcome message again
   - No previous session data should remain

## Expected Behavior

### Initial Load
- ✅ Customer window shows welcome message
- ✅ No stale data from previous sessions

### Session Start
- ✅ Customer window clears previous content first
- ✅ Customer window shows session started message
- ✅ Main application shows "<< Session Started >>"

### Session Stop
- ✅ Customer window content remains visible (no clearing)
- ✅ Content stays until next session starts

### Application Restart
- ✅ Customer window automatically clears on main app reload
- ✅ localStorage is cleaned up
- ✅ Fresh state for new session

## Sample script for a bankteller conversation with a customer
Refer to "sample_script_bankteller_en.txt"

## Debug Information

Open browser console (F12) to see debug messages:
- "Customer information cleared and clear flag set"
- "Clear flag detected, clearing customer info"
- "New customer info received: [content] with ID: [id]"
- "Sent customer info to localStorage: [content] with ID: [id]"

## Acknowledgement
This repository was originally derived from 
[aoai-realtime-multi-assistants](https://github.com/microsoft/aoai-realtime-multi-assistants)