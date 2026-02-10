# Work Request Form - Complete Structure & Conditional Logic

## Form Pages Overview
The form has 9 pages with conditional display based on "Nature of Your Request" and other field selections.

## Page 1: Nature of Your Request
**Always visible**

### Fields:
- **Nature of Your Request** (select, required)
  - We are running an EVENT
  - We need SIGNAGE Only
  - We need DIGITAL MEDIA
  - We want to place a PRINT MEDIA order
  - We need a VIDEO/FILM Project Only

---

## Page 2: Contact Details
**Always visible (after Page 1)**

### Fields:
- Name (text, required)
- Last Name (text, required)
- Cellphone (phone, required)
- Email (email, required)
- What is your role in church? (select, required)
  - Pastor
  - Elder
  - Church Staff
  - Ministry Leader
  - Volunteer
  - Congregant
- Congregation (select, required)
- Request Summary (textarea, required)
- Theme (text, required)

---

## Page 3: Event Details
**Conditional: Shows when "Nature of Your Request" = "We are running an EVENT"**

### Fields:
- Event Name (text, required)
- Event Organiser (text, required)
- Event Start Date & Time (date, required)
- Event End Date & Time (date, required)
- Venue (text, required)
- Event Reach (select, required)
  - Congregational
  - Global
  - Ministry
  - Regional Hub
- Which hubs/congregations will this event be for? (checkboxes)
  - JoshGen Pretoria
  - JoshGen Joburg
  - JoshGen Rustenburg
  - JoshGen Polokwane
  - JoshGen Nelspruit
  - JoshGen Bloemfontein
  - JoshGen Durban
  - JoshGen PE
  - JoshGen EL
- Do you need to have a registration form for your event? (radio, required)
  - Yes
  - No
- Do you need graphics for the event? (radio, required)
  - Yes
  - No
- Do you need signage for this event? (radio, required)
  - Yes
  - No
- Will you need any film/video? (radio, required)
  - Yes
  - No
- Will you need any recording services on the day? (radio, required)
  - Yes
  - No
- Will you need child-minding at your event? (radio, required)
  - Yes
  - No

---

## Page 4: Quicket Registration Form
**Conditional: Shows when "Do you need to have a registration form" = "Yes"**

### Fields:
- Description (textarea, required) - "Describe what you need to be captured on your form"
- Ticket Type (text, required)
- Ticket Price (number, required)
- Max Quantity of Tickets (number, required)
- Info we need to collect from Registrants (textarea, required)
- Do you want people to be able to donate? (radio, required)
  - Yes
  - No
- Registration Closing Date (date, required)

---

## Page 5: Video/Film Project
**Conditional: Shows when "Nature of Your Request" = "We need a VIDEO/FILM Project Only" OR "Will you need any film/video?" = "Yes"**

### Fields:
- What is your medium for this project? (select, required)
  - Digital
  - Film
  - Video
  - Archived Footage (VHS)
  - Both Digital and Film
- Tell us about your project (textarea, required)
- Distribution (select, required)
  - Public
  - Members Only
  - Global
  - Congregational
  - Ministry
  - Regional Hub
- Intended Audience (text, required)
- What is the content of the video/film (what will we be recording)? (textarea, required)
- Will you be supplying any supplementary/companion documents for your video/film? (radio, required)
  - Yes
  - No
- Date Needed (date, required)

---

## Page 6: Graphics
**Conditional: Shows when "Do you need graphics for the event?" = "Yes"**

### Fields:
- WhatsApp Graphic (checkbox)
- Instagram Graphic (checkbox)
- AV Slide (1920x1080px) (checkbox)
- Other (Please Specify) (text)

---

## Page 7: Digital Media
**Conditional: Shows when "Nature of Your Request" = "We need DIGITAL MEDIA"**

### Fields:
- Scope (select, required)
  - Select an Option
  - Congregational
  - Global
  - Ministry
  - Regional Hub
- WhatsApp Graphic (checkbox)
- Instagram Graphic (checkbox)
- Other (Please Specify) (text)

---

## Page 8: SIGNAGE
**Conditional: Shows when "Nature of Your Request" = "We need SIGNAGE Only" OR "Do you need signage for this event?" = "Yes"**

### Fields:
- Scope (select, required)
  - Select an Option
  - Congregational
  - Global
  - Ministry
  - Regional Hub
- Signage (checkboxes)
  - Sharkfin Banners (3m)
  - Temporary Fence Banner (2x1m)
  - Internal Directional Signs (Laminated A3, landscape)
  - Permanent External Building Signs
  - Other
- Sharkfin Banners: Quantity (number, required)
- Temporary Fence Banner: Quantify (number, required)
- Internal Directional Signs: Quantity (number, required)
- Permanent External Building Signs: Quantity (number, required)
- Other Signage (Please specify) (text, required)
- Other Signage: Quantity (number, required)

---

## Page 9: Print Media Details
**Conditional: Shows when "Nature of Your Request" = "We want to place a PRINT MEDIA order"**

### Fields:
- Print (checkboxes, required)
  - Congregational Flyer Handouts (A5)
  - Congregational Flyer Handouts (A6)
  - Posters (A3)
  - Posters (A4)
  - Invite/Evangelism Cards
  - Other
- Other? (Specify) (text, required)
- Quantity: Other (number, required)
- Quantity: Congregational Flyer Handouts A5 (number, required)
- Quantity: Congregational Flyer Handouts A6 (number, required)
- Quantity: Posters A3 (number, required)
- Quantity: Posters A4 (number, required)
- Quantity: Invite/Evangelism Cards (number, required)
- Terms & Conditions (checkbox, required)
  - "I agree to the Ts & Cs and the Privacy Policy"

---

## Conditional Logic Summary

### Based on "Nature of Your Request":
1. **"We are running an EVENT"**
   - Page 3: Event Details (always)
   - Page 4: Quicket Registration (if "need registration form" = Yes)
   - Page 5: Video/Film (if "need film/video" = Yes)
   - Page 6: Graphics (if "need graphics" = Yes)
   - Page 8: Signage (if "need signage" = Yes)
   
2. **"We need SIGNAGE Only"**
   - Page 8: SIGNAGE

3. **"We need DIGITAL MEDIA"**
   - Page 7: Digital Media

4. **"We want to place a PRINT MEDIA order"**
   - Page 9: Print Media Details

5. **"We need a VIDEO/FILM Project Only"**
   - Page 5: Video/Film Project

### Always visible:
- Page 1: Nature of Your Request
- Page 2: Contact Details
