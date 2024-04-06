# google-calendar-sync: Google App Script for syncing two calendars
### Motivation
Do you have a personal calendar with stuff going on (i.e., have a life outside of work)? This script is for you. It will block time on your work calendar corresponding to the events in your personal calendar (while making them private). No more discovering your colleague scheduled a Zoom call while you're at the dentist!

While services like [Recaim.ai](https://reclaim.ai/) do a wonderful job of syncing your personal and work calendar, your corporate restrictions might prevent you from sharing work calendar event details with third-party services (for a good reason). 

This app script is installed on your work account Google App Engine, and thus probably complies with your workspace requirements.

### Setup
1. Give your work calendar access to your personal calendar as described [here](https://support.google.com/calendar/answer/37082?hl=en&ref_topic=10510447&sjid=14802667752921791114-NA).
2. Check that you see your personal calendar events in your work calendar, **including event details**. 
3. When logged in to your Google **work account**, go to https://script.google.com/home and create a new project. Google will comfortably land you right into the code editor in the `myFuction` function body.
4. Replace the `myFunction` function with the script form `CalendarSync.gc` file.
5. In the script, provide your **personal calendar email** as a value for `personalCalendarId` constant.
6. Feel free to change other settings in other constants, like the name of the event to block your calendar (it's private, so don't sweat on it too much) and how long in the future events should be blocked.
7. Also, take a look at line 59 to adjust if you want to include all-day events, really long events (probably out-of-office events and such), and weekends. 
8. Don't forget to click save (the "save" icon, kids, is  a floppy disk, google it or ask ChatGPT).
9. Rename the project from "Untitled Project" to something useful, like "Calendar Sync".
10. While on it, rename the script file from `Code.gs` to `CalendarSync.gs` for good measure.
11. Click on the `+` by Services menu item.
12. Select Google Calendar API, and leave the name `Calendar` as it is referred to in the code.
13. Test the script by Clicking Run (make sure `syncCalendars` is selected as the function to run).
14. Check your work calendar. You should see the blocking events for personal events marked as `Busy`.
15. Rerun the script and check that the blocking events weren't duplicated or deleted.
16. Once verified that the script runs correctly, click the Stopwatch icon (Triggers) in the left side menu and then on the "Add trigger +" in the bottom right corner.
17. Make sure the trigger settings are as follows:
    * Function to run: `syncCalendars`
    * Deployment to run: `Head`
    * Event Source: `From calendar`
    * Calendar details: `Calendar updated`, your **personal calendar** email.
    * Failure notification settings: `Notify me immediately` (or not, your choice).
    * After clicking "Save", give access to your **work** Google calendar.

You're all set. Enjoy one less headache in your life.
