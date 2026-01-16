# Demo Payment Flow - Alternating Success/Failure

## Overview
The payment system has been updated to support a demo mode that alternates between successful and failed biometric authentication for testing purposes.

## Implementation Details

### Payment Flow
1. **User scans palm** to initiate payment
2. **Processing screen** shows for 2-3 seconds after scan with "Processing biometric data..." message
3. **Result popup appears** with either:
   - **Success** (1st, 3rd, 5th attempts, etc.): Shows "✅ Payment Successful!" with trade details
   - **Failure** (2nd, 4th, 6th attempts, etc.): Shows "❌ Wrong Biometrics - Access Denied"

### Key Changes Made

#### Payment.jsx
- **Added state tracking:**
  - `paymentAttempt`: Tracks the number of payment attempts
  - `isProcessing`: Shows the processing indicator during 2-3 second delay

- **Modified `handleStartScan()` function:**
  - Added 2-3 second delay after scan using `setTimeout()`
  - Implements alternating logic using `newAttempt % 2 === 1`
  - Odd attempts (1, 3, 5...): Proceeds with payment
  - Even attempts (2, 4, 6...): Shows "Wrong Biometrics" error

- **Updated UI:**
  - Shows "Processing biometric data..." spinner for 2-3 seconds after scanning
  - Displays demo failure message in error state
  - Added proper styling for error modals

#### Payment.css
- **Added processing indicator styles:**
  - Spinner animation
  - Pulsing text effect
  - Smooth animations

- **Added error modal styles:**
  - Red gradient background for error states
  - Error message styling
  - Error button styling

## Demo Sequence
```
1st Attempt  → ✅ Success
2nd Attempt  → ❌ Wrong Biometrics
3rd Attempt  → ✅ Success
4th Attempt  → ❌ Wrong Biometrics
5th Attempt  → ✅ Success
6th Attempt  → ❌ Wrong Biometrics
... and so on
```

## Testing the Feature
1. Navigate to the Payment page
2. Click "Scan Palm to Pay"
3. Let the scan complete (hold your hand steady)
4. Wait 2-3 seconds for processing
5. See the result (success or failure based on attempt count)
6. Click "Try Again" or "Done" to reset
7. Try again to see the opposite result

## Notes
- The attempt counter persists during the session
- Each "Try Again" increments the attempt counter
- The demo mode is always active - no production payment processing occurs
- All payment amounts and PIN verification work the same way for both success and failure scenarios
