let counters = {
    added: 0,
    matchedAndSkipped: 0,
    updated: 0,
    deleted: 0
};

/**
 * Synchronizes events from a personal calendar to a work calendar, with specific rules.
 */
function  syncCalendars() {
  const personalCalendarId = "yourpersonalcalendar@gmail.com"; //TODO CHANGE THIS!
  const workEventTitle = "Time blocked"; // Text for new events in work calendar
  const today = new Date();
  const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from today

  const personalCal = CalendarApp.getCalendarById(personalCalendarId);
  const workCal = CalendarApp.getDefaultCalendar();

  const personalEvents = personalCal.getEvents(today, endDate);
  const workEvents = workCal.getEvents(today, endDate);

  console.log(`Number of workEvents: ${workEvents.length}`);  
  console.log(`Number of personalEvents: ${personalEvents.length}`);

  let workEventsFiltered = filterWorkEvents(workEvents, workEventTitle);

  // Analyze personal events and take appropriate actions
  personalEvents.forEach(personalEvent => {
    if (shouldBeSynced(personalEvent, personalCalendarId)) {
      syncEvent(personalEvent, workEventsFiltered, workCal, workEventTitle, personalCalendarId);
    }
  });

  // Clean up work events that no longer match any personal event
  cleanupWorkEvents(workEventsFiltered, personalEvents, workCal);

  console.log(`Finished syncing calendars.`);
  logSummary();
}

/**
 * Filters work events that match a specific title.
 */
function filterWorkEvents(workEvents, title) {
  return workEvents.filter(event => event.getTitle() === title);
}

/**
 * Checks if a personal event should be synced based on various criteria, including
 * if the event is marked as 'Busy', is not all-day, lasts 4 hours or less, and occurs on a weekday.
 */
function shouldBeSynced(personalEvent, personalCalendarId) {
  const startTime = personalEvent.getStartTime();
  const endTime = personalEvent.getEndTime();
  const dayOfWeek = startTime.getDay();
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);

  //Feel free to remove conditions or modify duration
  if (personalEvent.isAllDayEvent() || durationHours > 4 || isWeekend()) {
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
    return true; // if failed, let's block anyway
  }
}

function isWeekend (dayOfWeek) {
  return dayOfWeek == 0 || dayOfWeek == 6;
}

/**
 * Syncs a personal event to the work calendar if necessary, updating counters along the way.
 */
function syncEvent(personalEvent, workEventsFiltered, workCal, workEventTitle, personalCalendarId) {
    // Try to find an existing matching work event
    const existingWorkEvent = findMatchingWorkEvent(personalEvent, workEventsFiltered);
    const personalTitle = personalEvent.getTitle();
    const personalDesc = personalEvent.getDescription();
    const expectedWorkDesc = personalTitle + '\n\n' + personalDesc;

    if (existingWorkEvent) {
        // Check if the existing event already matches the personal event
        if (existingWorkEvent.getDescription() === expectedWorkDesc && existingWorkEvent.getTitle() === workEventTitle) {
            // Event matches perfectly; no need to check free/busy status or update the event
            console.log(`Event [${personalEvent.getTitle()}] already matches the work event. Skipping.`);
            counters.matchedAndSkipped++; // Assuming you have a counter for matched and skipped events
            return; // Skip further checks
        } else {
            // If it exists but doesn't match exactly, it needs updating
            updateWorkEvent(existingWorkEvent, personalEvent, workEventTitle);
            counters.updated++;
        }
    } else {
        // If no matching work event exists, proceed with creation after necessary checks
        if (shouldBeSynced(personalEvent, personalCalendarId)) {
            createWorkEvent(workCal, personalEvent, workEventTitle);
            counters.added++;
        }
    }
}

/**
 * Updates an existing work event to match a personal event.
 */
function updateWorkEvent(workEvent, personalEvent, title) {
    workEvent.setTitle(title);
    workEvent.setDescription(`${personalEvent.getTitle()}\n\n${personalEvent.getDescription()}`);
    workEvent.setVisibility(CalendarApp.Visibility.PRIVATE);
    console.log(`Updated work event: ${workEvent.getId()}`);
}

/**
 * Finds a matching work event for a given personal event.
 */
function findMatchingWorkEvent(personalEvent, workEventsFiltered) {
  return workEventsFiltered.find(workEvent =>
    workEvent.getStartTime().getTime() === personalEvent.getStartTime().getTime() &&
    workEvent.getEndTime().getTime() === personalEvent.getEndTime().getTime());
}

/**
 * Creates a new work event based on a personal event.
 */
function createWorkEvent(workCal, personalEvent, title) {
  const newEvent = workCal.createEvent(title, personalEvent.getStartTime(), personalEvent.getEndTime(), {
    description: `${personalEvent.getTitle()}\n\n${personalEvent.getDescription()}`,
    visibility: 'private'
  });
  newEvent.removeAllReminders();
  console.log(`Created new work event: ${newEvent.getId()}`);
}

/**
 * Cleans up work events that no longer have a corresponding personal event.
 */
function cleanupWorkEvents(workEventsFiltered, personalEvents, workCal) {
  const personalEventTimes = personalEvents.map(event => ({
    start: event.getStartTime().getTime(),
    end: event.getEndTime().getTime()
  }));

  workEventsFiltered.forEach(workEvent => {
    const workEventTime = {
      start: workEvent.getStartTime().getTime(),
      end: workEvent.getEndTime().getTime()
    };
    const isOrphaned = !personalEventTimes.some(personalEventTime =>
      personalEventTime.start === workEventTime.start && personalEventTime.end === workEventTime.end);

    if (isOrphaned) {
      workEvent.deleteEvent();
      console.log(`Deleted orphaned work event: ${workEvent.getId()}`);
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
