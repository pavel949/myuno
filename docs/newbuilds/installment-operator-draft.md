# Project installment editor: operator draft only

Open an existing project in `/admin/projects` → Installments. Enter 1–12
percentage splits totaling exactly 100%, each due on an explicit calendar date
or a selected milestone (reservation, contract, construction, handover).
Calendar dates must be valid and nondecreasing. The browser can download a
project-bound `myuno-project-installments-v1` draft for review. Switching editor
tabs retains the current draft; closing the editor discards it. The project Save
action does not send the draft to the database.

The recognized marker fits the intent of the existing
`property_projects.payment_plan_template` field. No conversion of legacy
`payment_plan`, special-term text or unknown template JSON is implied.
There is no storage migration, write path, public rendering, reservation,
invoice, payment obligation or amount calculation. No data is put in localStorage,
sent to an external service, or published by the form.

Do not persist through the base project table until actual column/role policy
and the existing private writer or evidence flow are verified. A browser UI
allowlist is not authorization; authenticated table readers may otherwise see
an unpublished draft in any otherwise readable project. The future writer
needs exact project/actor admission and expected current revision.

## Extended v2 draft (backward compatible)

Basic dates and the original milestones still export v1. V2 preserves the
new choices without changing the old reader: one fixed reservation payment can
be credited toward an explicit percentage tranche. Enter amount and currency
on that tranche only; the percentage split still totals exactly 100%, and
the fixed credit must not be combined with a standalone reservation percentage.
This is a credit annotation, not a calculated or payable balance.

A tranche can be expressed in positive whole days or months after the initial
deposit, with no assumed deposit date or calculated deadline. Main construction
completion and roof completion are distinct source milestones and do not imply
dates or completion. The template stores only operator-entered data; a review
still needs the governing offer, actual payment chronology, currency and
whether the fixed credit fits the quoted tranche. Neither version writes or
publishes project data.
