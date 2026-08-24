# Healthcare Appointment & Follow-up Manager: System Design Document

## 1. Executive Summary & Architecture Overview
The Healthcare Appointment & Follow-up Manager is an asynchronous, event-driven clinical workflow platform engineered for high concurrency, patient safety, and seamless communication. The system orchestrates four critical domain operations: (1) **Double-Booking Prevention**, (2) **Slot Hold Mechanism**, (3) **Doctor Leave Conflict Resolution**, and (4) **Reliable Notification Delivery with Retries**.

---

## 2. Slot Hold Mechanism (Temporary TTL Reservations)
When a patient selects a consultation time slot and begins the symptom triage form, locking the slot immediately to prevent other users from selecting it is essential without permanently blocking the calendar if the patient abandons the session.

### Mechanism Workflow:
1. **Hold Acquisition**: When slot S = (doctorId, date, startTime) is clicked, the client requests a hold.
2. **Atomic Verification**: The system checks if S is free from confirmed bookings and unexpired holds.
3. **Time-To-Live (TTL) Lock**: A SlotHold record is written with an atomic expiration timestamp:
   ExpiresAt = CurrentTimestamp + 10 minutes
4. **Single Active Hold Invariant**: To prevent malicious slot hoarding, acquiring a new hold automatically purges any prior holds created by the same patientId.
5. **Real-time Client Feedback**: The client receives the expiration epoch and displays an active countdown timer (mm:ss).
6. **Automatic Hold Reclaim**: Scheduled background cron jobs (/api/cron/cleanup-holds) and read queries lazily purge expired holds (ExpiresAt < NOW()), immediately returning abandoned slots to the available pool.

---

## 3. Double-Booking Prevention (Concurrency & Atomic Guarantees)
In high-traffic clinical environments, multiple patients frequently attempt to book popular slots simultaneously. The system uses a two-tier defense:

1. **Unique Relational Invariant**: The database enforces an immutable unique constraint:
   UNIQUE(doctorId, appointmentDate, startTime)
2. **Two-Phase Atomic Claim**:
   - **Phase 1 (Validation)**: When the final booking payload is submitted, the system verifies that the slot is either held by the requesting patient or completely unoccupied.
   - **Phase 2 (Atomic Transition)**: Within a single atomic transaction, the slot transitions from HELD to CONFIRMED, and the temporary hold is cleared. If a race occurs where two concurrent requests bypass Phase 1, the database uniqueness constraint aborts the colliding transaction with HTTP 409 Conflict, ensuring mathematical zero double-booking.

---

## 4. Doctor Leave Conflict Handling & Cascading Resolution
Physicians frequently request scheduled leaves (conferences, illness, vacations) after patients have already booked appointments on those dates.

### Conflict Resolution Lifecycle:
1. **Conflict Detection**: When an Admin or Doctor submits a leave request [StartDate, EndDate], an atomic query identifies all conflicting appointments where:
   doctorId = D AND status IN (CONFIRMED, HELD) AND Date IN [StartDate, EndDate]
2. **State Transition**: All colliding appointments are atomically transitioned from CONFIRMED to RESCHEDULE_NEEDED with cancellationReason = "Doctor leave: " + reason.
3. **Active Hold Purge**: Any temporary holds falling in the leave window are immediately invalidated.
4. **Automated Patient Alert Dispatch**: The system dispatches high-priority email notifications to each affected patient containing:
   - Apology and explanation of the physician's absence.
   - Direct 1-click priority rescheduling link to choose an alternate date or specialist.
5. **UI Badging**: Affected appointments display prominent amber badges on the Patient Dashboard, prompting rapid rescheduling.

---

## 5. Notification Failure Handling & Retry Architecture
Reliability in medical communication is mission-critical. Failure to deliver booking confirmations, medication reminders, or leave rescheduling alerts directly impacts patient health outcomes.

### Outbox Pattern & Resilience Flow:
1. **Transactional Outbox Logging**: All outgoing notifications (Emails, Calendar events, Medication Reminders) are first recorded in the notification_logs table with status PENDING.
2. **Asynchronous Dispatch**: The dispatcher sends the payload via the configured provider (Resend, Nodemailer, SMTP).
   - **Success**: Status transitions to SENT.
   - **Failure**: Status transitions to FAILED with captured errorMessage and incremented retryCount.
3. **Exponential Backoff Retries**: Background cron workers (/api/cron/medication-reminders) query failed entries and retry delivery using exponential backoff:
   Delay(n) = 2^n * 60 seconds
4. **Administrative Dead-Letter Inspection**: The Admin Portal includes a live Email Sandbox & Notification Outbox enabling operators to view failed dispatches and trigger manual 1-click retries.
5. **LLM Graceful Fallback**: If external LLM APIs (Gemini/OpenAI) experience rate limits or network outages, requests automatically fall back to an internal deterministic clinical triage parser, ensuring zero downtime.
