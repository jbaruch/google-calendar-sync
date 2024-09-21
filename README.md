# google-calendar-sync: Google App Script for syncing two calendars

Do you have a personal calendar with stuff going on (i.e., have a life outside of work)? This script is for you. Google Calendar Sync is a Google Apps Script designed to synchronize events from your personal calendar to your work calendar, marking them as private in your work calendar. This ensures your availability accurately reflects across both calendars without oversharing personal details. It is ideal for anyone looking to manage their work and personal life balance more effectively.

### Motivation
While services like [Recaim.ai](https://reclaim.ai/) do a fantastic job of syncing your personal and work calendar, your corporate restrictions might prevent you from sharing work calendar event details with third-party services (for a good reason). 

This app script is installed on your work account, Google App Engine, so it is probably in line with your workspace requirements.

### Prerequisites
Before you start, ensure the following:
* Your workspace uses Google Calendar service.
* Your Google work account has permission to run Google Apps Scripts.
* You have access to both your personal and work Google Calendars.

### Setup
1. Calendar Access:
   * Give your work calendar access to your personal calendar as described [here](https://support.google.com/calendar/answer/37082?hl=en&ref_topic=10510447&sjid=14802667752921791114-NA).
   * Check that you see your personal calendar events in your work calendar, **including event details**. 
2. Script creation:
   * When logged in to your Google **work account**, go to https://script.google.com/home and create a new project. Google will comfortably land you right into the code editor in the `myFuction` function body.
   * Replace the `myFunction` function with the script form `CalendarSync.gc` file.
3. Configuration:
   * Assign your personal calendar's email to the personalCalendarId constant within the script.
   * Adjust settings like the block event's name (it's private, so don't sweat on it too much) and how far in the future events should be blocked according to your preferences.
   * Review line 38 to decide on including all-day events, lengthy events (probably out-of-office events and such), and weekends.  
   * Don't forget to click save (the "save" icon, kids, is  a floppy disk; google it or ask ChatGPT).
4. Naming:
   * Rename the project from "Untitled Project" to something useful, like "Calendar Sync".
   * While on it, rename the script file from `Code.gs` to `CalendarSync.gs` for good measure.
5. Google Calendar Advanced API access:
   * Click on the `+` by Services menu item.
   * Select Google Calendar API, and leave the name `Calendar` as it is referred to in the code.
6. Testing:
   * Test the script by Clicking Run (make sure `syncCalendars` is selected as the function to run).
   * Check your work calendar. You should see the blocking events for personal events marked as `Busy`.
   * Rerun the script and check that the blocking events weren't duplicated or deleted.
7. Automate syncing:
   * Once verified that the script runs correctly, click the Stopwatch icon (Triggers) in the left side menu and then on the "Add trigger +" in the bottom right corner.
   * Make sure the trigger settings are as follows:
      * Function to run: `syncCalendars`
      * Deployment to run: `Head`
      * Event Source: `From calendar`
      * Calendar details: `Calendar updated`, your **personal calendar** email.
      * Failure notification settings: `Notify me immediately` (or not, your choice).
      * After clicking "Save", give access to your **work** Google calendar.

You're all set. Enjoy one less headache in your life.

### Troubleshooting
If events aren't syncing as expected, check:
   * Calendar sharing permissions.
   * That the Google Calendar API is enabled and correctly configured.
   * Your script's logs for any errors.

### Contributions
Contributions are welcome! If you'd like to improve Google Calendar Sync, please:
 * Fork the repository.
 * Make your changes and test them.
 * Submit a pull request with a clear explanation of your changes.

### License
This project is open-sourced under the Apache 2 License. See the License tab for more details.

### Contact
Please open an issue on the GitHub repository's issues page for support or queries.
