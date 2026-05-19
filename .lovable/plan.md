## Shooting Requests Workflow

Build a multi-stage approval workflow for shooting requests with role-based handoffs.

### Workflow stages

```text
Employee creates request
        ↓
[pending_moderator] → Shooting Moderator reviews
        ↓
   ┌────┼────┬─────────────────┐
   ↓    ↓    ↓                 ↓
 Approve Decline  Escalate to Director (sensitive)
   ↓              ↓
   │         [pending_director] → approve/decline
   ↓              ↓
[pending_equipment] → Technical Supply assigns equipment
        ↓
[pending_driver] → Driver/Dispatcher assigned
        ↓
[scheduled] → shoot happens
        ↓
[completed]   (or [declined] at any approval stage)
```

### Roles (new)

Extend `app_role` enum with:
- `shooting_moderator`
- `director`
- `tech_supply`
- `driver`

Existing `admin` can act on any stage. Existing `employee`/`guest` can create requests.

### Database changes

Add columns to `shooting_requests`:
- `workflow_status` text — one of: `pending_moderator`, `pending_director`, `pending_equipment`, `pending_driver`, `scheduled`, `completed`, `declined`
- `sensitive` boolean default false
- `moderator_id`, `moderator_note`, `moderator_decided_at`
- `director_id`, `director_note`, `director_decided_at`
- `tech_supply_id`, `equipment_note`, `equipment_assigned_at`
- `driver_id`, `vehicle_info`, `driver_assigned_at`
- `decline_reason` text

New table `shooting_request_history` (audit trail):
- `request_id`, `actor_id`, `action`, `from_status`, `to_status`, `note`, `created_at`

### RLS

- INSERT: any authenticated user (sets `requester_id = auth.uid()`)
- SELECT: requester, moderator, director, tech_supply, driver assigned, or anyone holding the relevant role for the current stage, plus admin
- UPDATE: only the role responsible for the current `workflow_status` (e.g. only `shooting_moderator` or admin can update when status is `pending_moderator`)

### UI changes (`src/pages/ShootingRequests.tsx`)

- Tabs: **My requests** / **Inbox** (stage-specific queue based on user role) / **All** (admin)
- Create dialog: title, description, location, scheduled_date, sensitive checkbox
- Request detail dialog with stage-specific action panel:
  - Moderator: Approve → equipment / Escalate → director / Decline
  - Director: Approve → equipment / Decline
  - Tech Supply: equipment list + Mark provided → driver
  - Driver: vehicle info + Accept → scheduled / Mark completed
- Status badges + workflow progress indicator
- History timeline at bottom of detail

### Role management

Add the four new roles to `src/pages/RoleManagement.tsx` role options so admins can assign them.

### Out of scope (for this iteration)

- Notifications/emails on handoff
- Real-time updates (can be added later via Supabase realtime)

Want me to proceed?