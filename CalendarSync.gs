let counters = {
    added: 0,
    matchedAndSkipped: 0,
    updated: 0,
    deleted: 0
};

/**
 * Checks if a personal event should be synced based on various criteria.
 */
function shouldBeSynced(personalEvent, personalCalendarId, workCalendarId) {
  const startTime = personalEvent.getStartTime();
  const endTime = personalEvent.getEndTime();
  const dayOfWeek = startTime.getDay();
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  // Check if the user is on the guest list and has accepted the event
  const guestList = personalEvent.getGuestList(true);  // true to include self
  const personalUserGuest = guestList.find(guest => guest.getEmail() === personalCalendarId);
  
  if (!personalUserGuest) {
    console.log(`Event [${personalEvent.getTitle()}] - User is not on guest list. Skipping.`);
    return false;
  }

  // Check if the user has explicitly accepted the event
  if (personalUserGuest.getGuestStatus() !== CalendarApp.GuestStatus.YES) {
    console.log(`Event [${personalEvent.getTitle()}] is not accepted in personal calendar. Skipping.`);
    return false;
  }

  // Check if work account is already added to the event
  if (guestList.some(guest => guest.getEmail() === workCalendarId)) {
    console.log(`Event [${personalEvent.getTitle()}] already includes work account. Skipping sync.`);
    return false;
  }

  if (personalEvent.isAllDayEvent() || durationHours > 4 || dayOfWeek == 0 || dayOfWeek == 6) {
    return false;
  }

  try {
    var freebusyQuery = Calendar.Freebusy.query({
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: [{ id: personalCalendarId }]
    });

    console.log(`Freebusy query response for ${personalEvent.getTitle()}:`, JSON.stringify(freebusyQuery));

    var isEventFree = freebusyQuery.calendars[personalCalendarId].busy.length == 0;
    if(isEventFree) {
      console.log(`Event [${personalEvent.getTitle()}] is marked as Free.`);
    } else {
      console.log(`Event [${personalEvent.getTitle()}] is marked as Busy.`);
    }
    return !isEventFree;
  } catch (error) {
    console.log(`Error during Freebusy.query for event [${personalEvent.getTitle()}]: ${error.toString()}`);
    return false;
  }
}

/**
 * Syncs a personal event to the work calendar if necessary, updating counters along the way.
 */
function syncEvent(personalEvent, workCal, workEventTitle) {
    const existingWorkEvent = findMatchingWorkEvent(personalEvent, workCal.getEvents(personalEvent.getStartTime(), personalEvent.getEndTime()));
    const personalTitle = personalEvent.getTitle();
    const personalDesc = personalEvent.getDescription();
    const expectedWorkDesc = personalTitle + '\n\n' + personalDesc;

    if (existingWorkEvent) {
        if (existingWorkEvent.getDescription() === expectedWorkDesc && existingWorkEvent.getTitle() === workEventTitle) {
            console.log(`Event [${personalEvent.getTitle()}] already matches the work event. Skipping.`);
            counters.matchedAndSkipped++;
        } else {
            updateWorkEvent(existingWorkEvent, personalEvent, workEventTitle);
            counters.updated++;
        }
    } else {
        createWorkEvent(workCal, personalEvent, workEventTitle);
        counters.added++;
    }
}

/**
 * Finds a matching work event for a given personal event.
 */
function findMatchingWorkEvent(personalEvent, workEvents) {
  return workEvents.find(workEvent => {
    const startDiff = Math.abs(workEvent.getStartTime().getTime() - personalEvent.getStartTime().getTime());
    const endDiff = Math.abs(workEvent.getEndTime().getTime() - personalEvent.getEndTime().getTime());
    // Allow for a small time difference (e.g., 1 minute) to account for potential minor discrepancies
    return startDiff <= 60000 && endDiff <= 60000;
  });
}

/**
 * Updates an existing work event to match a personal event.
 */
function updateWorkEvent(workEvent, personalEvent, title) {
    workEvent.setTitle(title);
    workEvent.setDescription(`${personalEvent.getTitle()}\n\n${personalEvent.getDescription()}`);
    workEvent.setTime(personalEvent.getStartTime(), personalEvent.getEndTime());
    workEvent.setVisibility(CalendarApp.Visibility.PRIVATE);
    console.log(`Updated work event: ${workEvent.getId()}`);
}

/**
 * Creates a new work event based on a personal event.
 */
function createWorkEvent(workCal, personalEvent, title) {
  const newEvent = workCal.createEvent(title, personalEvent.getStartTime(), personalEvent.getEndTime(), {
    description: `${personalEvent.getTitle()}\n\n${personalEvent.getDescription()}`,
    visibility: CalendarApp.Visibility.PRIVATE
  });
  newEvent.removeAllReminders();
  console.log(`Created new work event: ${newEvent.getId()}`);
}

/**
 * Comprehensive cleanup function for work events.
 * Removes unnecessary work events, including:
 * - Duplicates
 * - Those corresponding to personal events where work account is already added
 * - Those no longer matching any personal event
 */
function cleanupWorkEvents(workCal, personalCal, workCalendarId, workEventTitle, startDate, endDate) {
  const workEvents = workCal.getEvents(startDate, endDate).filter(e => e.getTitle() === workEventTitle);
  const personalEvents = personalCal.getEvents(startDate, endDate);
  const seen = new Map();

  workEvents.forEach(workEvent => {
    const key = `${workEvent.getStartTime().getTime()}-${workEvent.getEndTime().getTime()}`;
    
    const correspondingPersonalEvent = personalEvents.find(personalEvent => 
      personalEvent.getStartTime().getTime() === workEvent.getStartTime().getTime() &&
      personalEvent.getEndTime().getTime() === workEvent.getEndTime().getTime()
    );

    if (seen.has(key) || 
        (correspondingPersonalEvent && correspondingPersonalEvent.getGuestList().some(guest => guest.getEmail() === workCalendarId)) ||
        !correspondingPersonalEvent) {
      try {
        workEvent.deleteEvent();
        counters.deleted++;
        console.log(`Deleted unnecessary work event: ${workEvent.getId()}`);
      } catch (error) {
        console.log(`Error deleting work event: ${error.toString()}`);
      }
    } else {
      seen.set(key, true);
    }
  });
}

function logSummary() {
    console.log(`Summary of Calendar Sync:`);
    console.log(`New events added: ${counters.added}`);
    console.log(`Events matched and skipped (no update needed): ${counters.matchedAndSkipped}`);
    console.log(`Events updated: ${counters.updated}`);
    console.log(`Events deleted: ${counters.deleted}`);
}

/**
 * Main function to synchronize calendars.
 */
function syncCalendars() {
  const personalCalendarId = "personal@example.com";
  const workCalendarId = "work@example.com";
  const workEventTitle = "Time blocked";
  const today = new Date();
  const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from today

  const personalCal = CalendarApp.getCalendarById(personalCalendarId);
  const workCal = CalendarApp.getCalendarById(workCalendarId);

  const personalEvents = personalCal.getEvents(today, endDate);

  personalEvents.forEach(personalEvent => {
    if (shouldBeSynced(personalEvent, personalCalendarId, workCalendarId)) {
      syncEvent(personalEvent, workCal, workEventTitle);
    }
  });

  cleanupWorkEvents(workCal, personalCal, workCalendarId, workEventTitle, today, endDate);

  console.log(`Finished syncing calendars.`);
  logSummary();
}
