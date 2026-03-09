# Apple Pay Domain Verification

This directory contains the Apple Pay domain verification file required for Apple Pay on the Web.

## Setup Instructions

1. **Log in to G2Pay MMS Portal**
   - Go to: Preferences → Digital Wallets

2. **Add Your Domain**
   - Enter your production domain: `babybets.co.uk`
   - Press Enter to add it

3. **Download the Verification File**
   - A pop-up will appear with instructions
   - Click the download link for the Domain Verification File
   - **IMPORTANT**: Do NOT click OK until the file is uploaded to your server

4. **Upload the File Here**
   - Name: `apple-developer-merchantid-domain-association`
   - Place it in this directory: `public/.well-known/`
   - **NO file extension** (not .txt, not .pdf - just the filename)

5. **Verify the File is Accessible**
   - The file must be accessible at: `https://babybets.co.uk/.well-known/apple-developer-merchantid-domain-association`
   - Apple will check this URL before approving your domain

6. **Complete Registration in MMS**
   - Once the file is uploaded and accessible via HTTPS, click OK in the MMS pop-up
   - Apple will verify your domain

## Important Notes

- The file must be served over **HTTPS** (not HTTP)
- Do not add any file extension to the verification file
- On Windows, check that `.txt` hasn't been automatically added
- The file must remain accessible at all times for Apple Pay to work
